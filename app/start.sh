#!/bin/sh
npm install && npm run build && PORT=$DATABRICKS_APP_PORT npm run start
