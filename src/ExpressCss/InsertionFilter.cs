using System.IO;
using System.Web;

namespace ExpressCss
{
    class InsertionFilter : MemoryStream
    {
        public InsertionFilter(HttpResponseBase response, string applicationPath)
        {
            this.response = response;
            this.applicationPath = applicationPath;
            outputStream = response.Filter;
        }

        readonly Stream outputStream;
        readonly HttpResponseBase response;
        readonly string applicationPath;

        public override void Write(byte[] buffer, int offset, int count)
        {
            if (IsHtmlResponse)
            {
                WriteWithReplacement(buffer, offset, count);
            }
            else
            {
                outputStream.Write(buffer, offset, count);
            }
        }

        void WriteWithReplacement(byte[] buffer, int offset, int count)
        {
            var encoding = response.Output.Encoding;
            var html = encoding.GetString(buffer, offset, count);
            var index = html.IndexOf("</body>");
            if (index >= 0)
            {
                html = InsertScriptTag(html, index);

                buffer = encoding.GetBytes(html);
                outputStream.Write(buffer, 0, buffer.Length);
            }
            else
            {
                // Output as normal
                outputStream.Write(buffer, offset, count);
            }
        }

        string InsertScriptTag(string html, int index)
        {
            var script = string.Format(
                "\r\n<script src=\"{0}/_instantcss/assets/install\" type=\"text/javascript\"></script>\r\n",
                applicationPath
                );
            html = html.Insert(index, script);
            return html;
        }

        bool IsHtmlResponse
        {
            get
            {
                return response.ContentType == "text/html" ||
                       response.ContentType == "application/xhtml+xml";
            }
        }
    }
}