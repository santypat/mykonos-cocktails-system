import serverless from 'serverless-http';
import app from './app.js';

const functionPrefix = '/.netlify/functions/api';
const serverlessHandler = serverless(app, {
  basePath: '/.netlify/functions/api'
});

export const handler = (event, context) => {
  const path = event.path || '';
  const shouldPreservePath = path.startsWith(`${functionPrefix}/api/`) || path.startsWith(`${functionPrefix}/uploads/`);

  if (path.startsWith(`${functionPrefix}/`) && !shouldPreservePath) {
    event.path = `${functionPrefix}/api${path.slice(functionPrefix.length)}`;
  }

  return serverlessHandler(event, context);
};
