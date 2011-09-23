using System.Web;
using System.Web.Routing;

namespace ExpressCss
{
    class AssetRouteHandler : IRouteHandler
    {
        public IHttpHandler GetHttpHandler(RequestContext requestContext)
        {
            return new AssetHttpHandler(requestContext.RouteData.GetRequiredString("path"));
        }
    }
}