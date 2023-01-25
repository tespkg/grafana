package dtos

import (
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/services/thumbs"
	"github.com/grafana/grafana/pkg/setting"
)

type FrontendSettingsAuthDTO struct {
	OAuthSkipOrgRoleUpdateSync bool `json:"OAuthSkipOrgRoleUpdateSync"`
	SAMLSkipOrgRoleSync        bool `json:"SAMLSkipOrgRoleSync"`
	LDAPSkipOrgRoleSync        bool `json:"LDAPSkipOrgRoleSync"`
	GoogleSkipOrgRoleSync      bool `json:"GoogleSkipOrgRoleSync"`
	JWTAuthSkipOrgRoleSync     bool `json:"JWTAuthSkipOrgRoleSync"`
	GrafanaComSkipOrgRoleSync  bool `json:"GrafanaComSkipOrgRoleSync"`
	AzureADSkipOrgRoleSync     bool `json:"AzureADSkipOrgRoleSync"`
	DisableSyncLock            bool `json:"DisableSyncLock"`
}

type FrontendSettingsBuildInfoDTO struct {
	HideVersion   bool   `json:"hideVersion"`
	Version       string `json:"version"`
	Commit        string `json:"commit"`
	Buildstamp    int64  `json:"buildstamp"`
	Edition       string `json:"edition"`
	LatestVersion string `json:"latestVersion"`
	HasUpdate     bool   `json:"hasUpdate"`
	Env           string `json:"env"`
}

type FrontendSettingsLicenseInfoDTO struct {
	Expiry          int64           `json:"expiry"`
	StateInfo       string          `json:"stateInfo"`
	LicenseUrl      string          `json:"licenseUrl"`
	Edition         string          `json:"edition"`
	EnabledFeatures map[string]bool `json:"enabledFeatures"`
}

type FrontendSettingsAzureDTO struct {
	Cloud                  string `json:"cloud"`
	ManagedIdentityEnabled bool   `json:"managedIdentityEnabled"`
}

type FrontendSettingsCachingDTO struct {
	Enabled bool `json:"enabled"`
}

type FrontendSettingsRecordedQueriesDTO struct {
	Enabled bool `json:"enabled"`
}

type FrontendSettingsReportingDTO struct {
	Enabled bool `json:"enabled"`
}

type FrontendSettingsUnifiedAlertingDTO struct {
	MinInterval string `json:"minInterval"`
}

type FrontendSettingsDTO struct {
	DefaultDatasource          string                           `json:"defaultDatasource"`
	Datasources                map[string]plugins.DataSourceDTO `json:"datasources"`
	MinRefreshInterval         string                           `json:"minRefreshInterval"`
	Panels                     map[string]plugins.PanelDTO      `json:"panels"`
	AppUrl                     string                           `json:"appUrl"`
	AppSubUrl                  string                           `json:"appSubUrl"`
	AllowOrgCreate             bool                             `json:"allowOrgCreate"`
	AuthProxyEnabled           bool                             `json:"authProxyEnabled"`
	LdapEnabled                bool                             `json:"ldapEnabled"`
	JwtHeaderName              string                           `json:"jwtHeaderName"`
	JwtUrlLogin                bool                             `json:"jwtUrlLogin"`
	AlertingEnabled            *bool                            `json:"alertingEnabled"`
	AlertingErrorOrTimeout     string                           `json:"alertingErrorOrTimeout"`
	AlertingNoDataOrNullValues string                           `json:"alertingNoDataOrNullValues"`
	AlertingMinInterval        int64                            `json:"alertingMinInterval"`
	LiveEnabled                bool                             `json:"liveEnabled"`
	AutoAssignOrg              bool                             `json:"autoAssignOrg"`

	VerifyEmailEnabled  bool `json:"verifyEmailEnabled"`
	SigV4AuthEnabled    bool `json:"sigV4AuthEnabled"`
	AzureAuthEnabled    bool `json:"azureAuthEnabled"`
	RbacEnabled         bool `json:"rbacEnabled"`
	ExploreEnabled      bool `json:"exploreEnabled"`
	HelpEnabled         bool `json:"helpEnabled"`
	ProfileEnabled      bool `json:"profileEnabled"`
	QueryHistoryEnabled bool `json:"queryHistoryEnabled"`

	GoogleAnalyticsId                   string `json:"googleAnalyticsId"`
	GoogleAnalytics4Id                  string `json:"googleAnalytics4Id"`
	GoogleAnalytics4SendManualPageViews bool   `json:"GoogleAnalytics4SendManualPageViews"`

	RudderstackWriteKey     string `json:"rudderstackWriteKey"`
	RudderstackDataPlaneUrl string `json:"rudderstackDataPlaneUrl"`
	RudderstackSdkUrl       string `json:"rudderstackSdkUrl"`
	RudderstackConfigUrl    string `json:"rudderstackConfigUrl"`

	FeedbackLinksEnabled                bool                     `json:"feedbackLinksEnabled"`
	ApplicationInsightsConnectionString string                   `json:"applicationInsightsConnectionString"`
	ApplicationInsightsEndpointUrl      string                   `json:"applicationInsightsEndpointUrl"`
	DisableLoginForm                    bool                     `json:"disableLoginForm"`
	DisableUserSignUp                   bool                     `json:"disableUserSignUp"`
	LoginHint                           string                   `json:"loginHint"`
	PasswordHint                        string                   `json:"passwordHint"`
	ExternalUserMngInfo                 string                   `json:"externalUserMngInfo"`
	ExternalUserMngLinkUrl              string                   `json:"externalUserMngLinkUrl"`
	ExternalUserMngLinkName             string                   `json:"externalUserMngLinkName"`
	ViewersCanEdit                      bool                     `json:"viewersCanEdit"`
	AngularSupportEnabled               bool                     `json:"angularSupportEnabled"`
	EditorsCanAdmin                     bool                     `json:"editorsCanAdmin"`
	DisableSanitizeHtml                 bool                     `json:"disableSanitizeHtml"`
	PluginsToPreload                    []*plugins.PreloadPlugin `json:"pluginsToPreload"`

	Auth FrontendSettingsAuthDTO `json:"auth"`

	BuildInfo FrontendSettingsBuildInfoDTO `json:"buildInfo"`

	LicenseInfo FrontendSettingsLicenseInfoDTO `json:"licenseInfo"`

	FeatureToggles                   map[string]bool                `json:"featureToggles"`
	RendererAvailable                bool                           `json:"rendererAvailable"`
	RendererVersion                  string                         `json:"rendererVersion"`
	SecretsManagerPluginEnabled      bool                           `json:"secretsManagerPluginEnabled"`
	Http2Enabled                     bool                           `json:"http2Enabled"`
	Sentry                           setting.Sentry                 `json:"sentry"`
	GrafanaJavascriptAgent           setting.GrafanaJavascriptAgent `json:"grafanaJavascriptAgent"`
	PluginCatalogURL                 string                         `json:"pluginCatalogURL"`
	PluginAdminEnabled               bool                           `json:"pluginAdminEnabled"`
	PluginAdminExternalManageEnabled bool                           `json:"pluginAdminExternalManageEnabled"`
	PluginCatalogHiddenPlugins       []string                       `json:"pluginCatalogHiddenPlugins"`
	ExpressionsEnabled               bool                           `json:"expressionsEnabled"`
	AwsAllowedAuthProviders          []string                       `json:"awsAllowedAuthProviders"`
	AwsAssumeRoleEnabled             bool                           `json:"awsAssumeRoleEnabled"`
	SupportBundlesEnabled            bool                           `json:"supportBundlesEnabled"`

	Azure FrontendSettingsAzureDTO `json:"azure"`

	Caching                 FrontendSettingsCachingDTO         `json:"caching"`
	RecordedQueries         FrontendSettingsRecordedQueriesDTO `json:"recordedQueries"`
	Reporting               FrontendSettingsReportingDTO       `json:"reporting"`
	UnifiedAlertingEnabled  *bool                              `json:"unifiedAlertingEnabled"`
	UnifiedAlerting         FrontendSettingsUnifiedAlertingDTO `json:"unifiedAlerting"`
	Oauth                   map[string]interface{}             `json:"oauth"`
	SamlEnabled             bool                               `json:"samlEnabled"`
	SamlName                string                             `json:"samlName"`
	TokenExpirationDayLimit int                                `json:"tokenExpirationDayLimit"`

	DashboardPreviews *thumbs.DashboardPreviewsSetupConfig `json:"dashboardPreviews"`

	GeomapDefaultBaseLayerConfig *map[string]interface{} `json:"geomapDefaultBaseLayerConfig"`
	GeomapDisableCustomBaseLayer bool                    `json:"geomapDisableCustomBaseLayer"`

	IsPublicDashboardView bool `json:"isPublicDashboardView"`

	DateFormats setting.DateFormats `json:"dateFormats"`
}
