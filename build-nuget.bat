if not exist nuget. (mkdir nuget)

nuget pack -Build src\ExpressCss\ExpressCss.csproj -Symbols -OutputDirectory nuget -Prop Configuration=Release