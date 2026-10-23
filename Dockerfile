FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY Bookify.Api/Bookify.Api.csproj Bookify.Api/
RUN dotnet restore Bookify.Api/Bookify.Api.csproj
COPY Bookify.Api/ Bookify.Api/
RUN dotnet publish Bookify.Api/Bookify.Api.csproj -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "Bookify.Api.dll"]
