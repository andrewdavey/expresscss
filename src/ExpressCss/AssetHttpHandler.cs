using System.Web;
using ExpressCss.Properties;

namespace ExpressCss
{
    class AssetHttpHandler : IHttpHandler
    {
        readonly string path;

        public AssetHttpHandler(string path)
        {
            this.path = path;
        }

        public void ProcessRequest(HttpContext context)
        {
            var javascript = Resources.ResourceManager.GetString(path);
            context.Response.ContentType = "text/javascript";
            context.Response.Write(javascript);
        }

        public bool IsReusable
        {
            get { return false; }
        }
    }
}