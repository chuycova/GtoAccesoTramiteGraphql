import express from "express";
import compression from "compression";
import cors from "cors";
import environments from "./config/environments";
import { ApolloServer } from "apollo-server-express";

import fs from "fs";
import https from "https";
import http from "http";

import {
    client,
    psql,
  } from "./config/db-pg";
import schema from "./schema";
  const configurations: any = {
    // Note: You may need sudo to run on port 443
    production: {
      ssl: true,
      port: process.env.PORT||443,
      hostname: process.env.SITE || "micrositios.diputados.gob.mx",
    },
    development: {
      ssl: false,
      port: process.env.PORT || 5001,
      hostname: "localhost",
    },
  };
  if (process.env.NODE_ENV !== "production") {
    const envs = environments;
    // console.log(process.env.NODE_ENV);
  }
  const environment = process.env.NODE_ENV || "production";
  const config = configurations[environment];
  async function init() {
    const app = express();
    app.use(cors());
    app.use(compression());
    var apollo: any = new ApolloServer({
      schema,
      introspection: true,
      //Token
      context: async ({ req, connection }: any) => {
        const token = req ? req.headers.authorization : connection.authorization;
        return {
          client,
          psql,
          token
        };
      },
    });
    await apollo.start();
    
    // var server: any;
    apollo.applyMiddleware({
      app,
      bodyParserConfig: { limit: process.env.LIMIT_BODY || "50mb" },
    });
  
    // const httpServer = createServer(app);
    var server: any;
    if (config.ssl) {
      // Assumes certificates are in a .ssl folder off of the package root. Make sure
      // these files are secured.
      server = https.createServer(
        {
          // key: fs.readFileSync(`./ssl/${environment}/server.key`),
          key: fs.readFileSync(
            process.env.ROUTE_KEY || `./ssl/${environment}/server.key`
          ),
          cert: fs.readFileSync(
            process.env.ROUTE_CERT || `./ssl/${environment}/server.crt`
          ),
          ca: fs.readFileSync(process.env.ROUTE_PEM || "local-certificate.pem"),
          rejectUnauthorized: false,
        },
        app
      );
      // server.installSubscriptionHandlers(https);
    } else {
      server = http.createServer(app);
      // server.installSubscriptionHandlers(http);
    }
  
    server.listen({ port: config.port }, () =>
      console.log(
        "🚀 Server ready at",
        `http${config.ssl ? "s" : ""}://${config.hostname}:${config.port}${
          apollo.graphqlPath
        }`
      )
    );
  }
  init();
  