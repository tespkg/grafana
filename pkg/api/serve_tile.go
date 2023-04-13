package api

import (
	"bytes"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"text/template"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/vectortile"
	"github.com/grafana/grafana/pkg/components/simplejson"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/web"
	"golang.org/x/exp/slices"
)

func (hs *HTTPServer) RequestVectorTile(c *contextmodel.ReqContext) response.Response {
	if c.Req.Method != http.MethodGet && c.Req.Method != http.MethodPost {
		return response.Error(http.StatusMethodNotAllowed, "method not allowed", nil)
	}

	params := web.Params(c.Req)
	x, err := strconv.Atoi(params[":x"])
	if err != nil {
		return response.Error(http.StatusBadRequest, "invalid x", err)
	}
	y, err := strconv.Atoi(params[":y"])
	if err != nil {
		return response.Error(http.StatusBadRequest, "invalid y", err)
	}
	z, err := strconv.Atoi(params[":z"])
	if err != nil {
		return response.Error(http.StatusBadRequest, "invalid z", err)
	}

	tile, err := vectortile.MakeTile(x, y, z, "pbf")
	if err != nil {
		var errTile vectortile.TileAppError
		if errors.As(err, &errTile) {
			return response.Error(errTile.HTTPCode, errTile.Error(), errTile.SrcErr)
		}
		return response.Error(http.StatusBadRequest, "invalid tile", errTile)
	}

	srID, err := strconv.Atoi(c.Query("srid"))
	if err != nil {
		return response.Error(http.StatusBadRequest, "invalid srid", err)
	}
	idColumn := c.Query("idColumn")
	var attrs []string
	if len(c.Query("attrs")) > 0 {
		attrs = strings.Split(c.Query("attrs"), ",")
	}
	if !slices.Contains(attrs, idColumn) {
		attrs = append(attrs, idColumn)
	}

	// TODO(jackieli): sanitise parameters
	geomQuery, err := requestSQL(tile, c.Query("query"), srID, c.Query("layerName"), c.Query("geomColumn"), idColumn, attrs)
	if err != nil {
		return response.Error(http.StatusBadRequest, "failed to generate SQL", err)
	}

	hs.log.Debug("sending postgis mvt query", "geomQuery", geomQuery)
	fmt.Println(geomQuery)

	query := simplejson.NewFromAny(map[string]any{
		"datasource": map[string]any{
			"uid": c.Query("dsUid"),
		},
		"rawSql": geomQuery,
		"format": "table",
		"refId":  "A",
	})

	reqDTO := dtos.MetricRequest{
		Queries: []*simplejson.Json{query},
	}
	resp, err := hs.queryDataService.QueryData(c.Req.Context(), c.SignedInUser, c.SkipCache, reqDTO)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to query data", err)
	}

	refA := resp.Responses["A"]
	if len(refA.Frames) == 0 || len(refA.Frames[0].Fields) == 0 {
		// query returned no data
		return response.Empty(http.StatusOK)
	}

	val, ok := refA.Frames[0].Fields[0].ConcreteAt(0)
	if !ok {
		return response.Error(http.StatusInternalServerError, "failed to get data", err)
	}

	header := http.Header{}
	header.Set("Content-Type", "application/vnd.mapbox-vector-tile")

	return response.CreateNormalResponse(header, []byte(val.(string)), http.StatusOK)
}

var (
	DefaultResolution = 4096
	DefaultBuffer     = 256
)

func requestSQL(tile vectortile.Tile, originalSQL string, srID int, layerName string, geomColumn string, idColumn string, attrs []string) (string, error) {
	type sqlParameters struct {
		TileSQL        string
		QuerySQL       string
		TileSrid       int
		Resolution     int
		Buffer         int
		Properties     string
		MvtParams      string
		Limit          string
		GeometryColumn string
		Srid           int

		OriginalSQL string
		FilterSQL   string
	}

	// need both the exact tile boundary for clipping and an
	// expanded version for querying
	tileBounds := tile.Bounds
	queryBounds := tile.Bounds
	queryBounds.Expand(tile.Width() * float64(DefaultBuffer) / float64(DefaultResolution))
	tileSQL := tileBounds.SQL()
	tileQuerySQL := queryBounds.SQL()

	// SRID of the tile we are going to generate, which might be different
	// from the layer SRID in the database
	tileSrid := tile.Bounds.SRID

	// only specify MVT format parameters we have configured
	// bytea ST_AsMVT(anyelement row, text name, integer extent, text geom_name, text feature_id_name);
	mvtParams := make([]string, 0)
	mvtParams = append(mvtParams, fmt.Sprintf("'%s'", layerName))       // name
	mvtParams = append(mvtParams, fmt.Sprintf("%d", DefaultResolution)) // extent
	mvtParams = append(mvtParams, fmt.Sprintf("'%s'", geomColumn))      // geom_name
	mvtParams = append(mvtParams, fmt.Sprintf("'%s'", idColumn))        // feature_id_name

	sp := sqlParameters{
		TileSQL:        tileSQL,
		QuerySQL:       tileQuerySQL,
		TileSrid:       tileSrid,
		Resolution:     DefaultResolution,
		Buffer:         DefaultBuffer,
		Properties:     strings.Join(attrs, ","),
		MvtParams:      strings.Join(mvtParams, ","),
		OriginalSQL:    originalSQL,
		GeometryColumn: geomColumn,
		Srid:           srID,
	}

	// bytea ST_AsMVT(anyelement row, text name, integer extent, text geom_name, text feature_id_name);
	// SELECT ST_AsMVT(mvtgeom, 'public.nyc_census_blocks', 4096, 'geom', 'gid') FROM (
	//         SELECT ST_AsMVTGeom(
	//                 ST_Transform(ST_Force2D(t."geom"), 3857),
	//                 bounds.geom_clip,
	//                 4096,
	//                 256
	//           ) AS "geom"
	//           , "gid", "popn_white", "popn_black", "popn_nativ", "popn_asian", "blkid", "popn_total", "popn_other", "boroname", "gid"
	//         FROM "public"."nyc_census_blocks" t, (
	//                 SELECT ST_MakeEnvelope(-8.223401251032384e+06, 4.955565417784536e+06, -8.220955266127259e+06, 4.958011402689662e+06, 3857)  AS geom_clip,
	//                                 ST_MakeEnvelope(-8.223554125088954e+06, 4.955412543727966e+06, -8.220802392070688e+06, 4.958164276746232e+06, 3857) AS geom_query
	//                 ) bounds
	//         WHERE ST_Intersects(t."geom",
	//                                                 ST_Transform(bounds.geom_query, 26918))
	//
	//         LIMIT 50000
	// ) mvtgeom

	var buf bytes.Buffer
	if err := mvtTemplate.Execute(&buf, sp); err != nil {
		return "", err
	}
	return buf.String(), nil
}

// TODO: Remove ST_Force2D when fixes to line clipping are common
// in GEOS. See https://trac.osgeo.org/postgis/ticket/4690
const mvtTemplateSql = `
SELECT ST_AsMVT(mvtgeom, {{ .MvtParams }}) FROM (
	SELECT ST_AsMVTGeom(
		ST_Transform(ST_Force2D(t."{{ .GeometryColumn }}"), {{ .TileSrid }}),
		bounds.geom_clip,
		{{ .Resolution }},
		{{ .Buffer }}
	  ) AS "{{ .GeometryColumn }}"
	  {{ if .Properties }}
	  , {{ .Properties }}
	  {{ end }}
	FROM ({{ .OriginalSQL }}) t, (
		SELECT {{ .TileSQL }}  AS geom_clip,
				{{ .QuerySQL }} AS geom_query
		) bounds
	WHERE ST_Intersects(t."{{ .GeometryColumn }}",ST_Transform(bounds.geom_query, {{ .Srid }}))
		{{ .FilterSQL }}
	{{ .Limit }}
) mvtgeom
`

var mvtTemplate = template.Must(template.New("mvtTemplate").Parse(mvtTemplateSql))
