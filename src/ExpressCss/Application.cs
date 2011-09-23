using System.Web;
using System.Web.Routing;
using ExpressCss;
using SignalR;
using SignalR.Routing;
using Microsoft.Web.Infrastructure.DynamicModuleHelper;
using System.IO;

[assembly: WebActivator.PreApplicationStartMethod(typeof(Application), "PreApplicationStart")]
[assembly: WebActivator.PostApplicationStartMethod(typeof(Application), "PostApplicationStart")]
[assembly: WebActivator.ApplicationShutdownMethod(typeof(Application), "Shutdown")]

namespace ExpressCss
{
    public static class Application
    {
        static FileSystemWatcher _watcher;

        public static void PreApplicationStart()
        {
            WatchFileSystemForChanges();
            DynamicModuleUtility.RegisterModule(typeof(ExpressCssHttpModule));
        }

        public static void PostApplicationStart()
        {
            InstallRoutes(RouteTable.Routes);
        }

        public static void Shutdown()
        {
            if (_watcher != null)
            {
                _watcher.Dispose();
                _watcher = null;
            }
        }

        static void InstallRoutes(RouteCollection routes)
        {
            var assetRoute = new Route("_instantcss/assets/{*path}", new AssetRouteHandler());
            routes.Insert(0, assetRoute);

            var connectionRoute = routes.MapConnection<ExpressCssConnection>("ExpressCss", "_instantcss/connection/{*operation}");
            routes.Remove(connectionRoute);
            routes.Insert(1, connectionRoute);
        }

        static void WatchFileSystemForChanges()
        {
            _watcher = new FileSystemWatcher(HttpRuntime.AppDomainAppPath)
            {
                IncludeSubdirectories = true,
                NotifyFilter = NotifyFilters.LastWrite,
                EnableRaisingEvents = true
            };
            _watcher.Changed += (sender, e) =>
            {
                var connection = Connection.GetConnection<ExpressCssConnection>();
                var url = ConvertFilenameToUrl(e.FullPath);
                connection.Broadcast(url);
            };
        }

        static string ConvertFilenameToUrl(string fullPath)
        {
            var root = HttpRuntime.AppDomainAppVirtualPath.TrimEnd('/');
            var physicalPath = HttpRuntime.AppDomainAppPath.TrimEnd('\\', '/');
            var url = root + "/" + fullPath.Substring(physicalPath.Length + 1).Replace('\\', '/');
            return url;
        }
    }
}