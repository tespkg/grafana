package vectortile

import (
	"fmt"
	"math"
)

// Tile represents a single tile in a tile
// pyramid, usually referenced in a URL path
// of the form "Zoom/X/Y.Ext"
type Tile struct {
	Zoom   int    `json:"zoom"`
	X      int    `json:"x"`
	Y      int    `json:"y"`
	Ext    string `json:"ext"`
	Bounds Bounds `json:"bounds"`
}

type TileAppError struct {
	HTTPCode int
	SrcErr   error
	Topic    string
	Message  string
}

// Error prints out a reasonable string format
func (tae TileAppError) Error() string {
	if tae.Message != "" {
		return fmt.Sprintf("%s\n%s", tae.Message, tae.SrcErr.Error())
	}
	return tae.SrcErr.Error()
}

// makeTile uses the map populated by the mux.Router
// containing x, y and z keys, and extracts integers
// from them
func MakeTile(x, y, zoom int, ext string) (Tile, error) {
	// Router path restriction ensures
	// these are always numbers
	tile := Tile{Zoom: zoom, X: x, Y: y, Ext: ext}
	// No tile numbers outside the tile grid implied
	// by the zoom?
	if !tile.IsValid() {
		invalidTileError := TileAppError{
			HTTPCode: 400,
			SrcErr:   fmt.Errorf("invalid tile address %s", tile.String()),
		}
		return tile, invalidTileError
	}
	e := tile.CalculateBounds()
	return tile, e
}

func (tile *Tile) Width() float64 {
	return math.Abs(tile.Bounds.Xmax - tile.Bounds.Xmin)
}

// IsValid tests that the tile contains
// only tile addresses that fit within the
// zoom level, and that the zoom level is
// not crazy large
func (tile *Tile) IsValid() bool {
	if tile.Zoom > 32 || tile.Zoom < 0 {
		return false
	}
	worldTileSize := int(1) << uint(tile.Zoom)
	if tile.X < 0 || tile.X >= worldTileSize ||
		tile.Y < 0 || tile.Y >= worldTileSize {
		return false
	}
	return true
}

// CalculateBounds calculates the cartesian bounds that
// correspond to this tile
func (tile *Tile) CalculateBounds() (e error) {
	serverBounds, e := getServerBounds()
	if e != nil {
		return e
	}

	worldWidthInTiles := float64(int(1) << uint(tile.Zoom))
	tileWidth := math.Abs(serverBounds.Xmax-serverBounds.Xmin) / worldWidthInTiles

	// Calculate geographic bounds from tile coordinates
	// XYZ tile coordinates are in "image space" so origin is
	// top-left, not bottom right
	xmin := serverBounds.Xmin + (tileWidth * float64(tile.X))
	xmax := serverBounds.Xmin + (tileWidth * float64(tile.X+1))
	ymin := serverBounds.Ymax - (tileWidth * float64(tile.Y+1))
	ymax := serverBounds.Ymax - (tileWidth * float64(tile.Y))
	tile.Bounds = Bounds{serverBounds.SRID, xmin, ymin, xmax, ymax}

	return nil
}

// String returns a path-like representation of the Tile
func (tile *Tile) String() string {
	return fmt.Sprintf("%d/%d/%d.%s", tile.Zoom, tile.X, tile.Y, tile.Ext)
}
