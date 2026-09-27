import serverless from 'serverless-http';
import app from './app.js';

const functionPrefix = '/.netlify/functions/api';
const serverlessHandler = serverless(app, {
  basePath: '/.netlify/functions/api'
});

export const handler = (event, context) => {
  const path = event.path || '';

  if (path.startsWith(`${functionPrefix}/`) && !path.startsWith(`${functionPrefix}/api/`)) {
    event.path = `${functionPrefix}/api${path.slice(functionPrefix.length)}`;
  }

  return serverlessHandler(event, context);
};
