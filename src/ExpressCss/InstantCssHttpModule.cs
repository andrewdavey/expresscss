using System.Web;

namespace ExpressCss
{
    class ExpressCssHttpModule : IHttpModule
    {
        public void Init(HttpApplication application)
        {
            application.BeginRequest += delegate
            {
                var response = new HttpResponseWrapper(application.Context.Response);
                
                response.Filter = new InsertionFilter(response, application.Context.Request.ApplicationPath.TrimEnd('/'));
            };
        }

        public void Dispose()
        {
        }
    }
}