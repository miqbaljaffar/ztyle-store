import { randomUUID } from 'node:crypto';
import type { Context } from 'aws-lambda';
import serverless from 'serverless-http';
import app from '../../../server/src/index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const expressHandler = serverless(app);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function dispatch(request: Request) {
  const url = new URL(request.url);
  const headers = Object.fromEntries(request.headers.entries());
  const contentType = request.headers.get('content-type') ?? '';
  const bodyBuffer = ['GET', 'HEAD'].includes(request.method)
    ? null
    : Buffer.from(await request.arrayBuffer());
  const requestId = randomUUID();

  const event = {
    httpMethod: request.method,
    path: url.pathname,
    headers,
    multiValueHeaders: {},
    queryStringParameters: Object.fromEntries(url.searchParams.entries()),
    multiValueQueryStringParameters: Object.fromEntries(
      [...new Set(url.searchParams.keys())].map((key) => [key, url.searchParams.getAll(key)]),
    ),
    pathParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: 'vercel',
      apiId: 'next-api',
      domainName: url.host,
      domainPrefix: url.hostname,
      httpMethod: request.method,
      path: url.pathname,
      protocol: 'HTTP/1.1',
      requestId,
      requestTimeEpoch: Date.now(),
      resourcePath: url.pathname,
      stage: 'production',
      identity: {
        sourceIp: request.headers.get('x-forwarded-for') ?? '',
        userAgent: request.headers.get('user-agent') ?? '',
      },
    },
    body: bodyBuffer
      ? contentType.includes('multipart/form-data')
        ? bodyBuffer.toString('base64')
        : bodyBuffer.toString('utf8')
      : null,
    isBase64Encoded: Boolean(bodyBuffer && contentType.includes('multipart/form-data')),
  };
  const context: Context = {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'ztyle-api',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:local:000000000000:function:ztyle-api',
    memoryLimitInMB: '1024',
    awsRequestId: requestId,
    logGroupName: '/aws/lambda/ztyle-api',
    logStreamName: requestId,
    getRemainingTimeInMillis: () => 30_000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };
  const result: unknown = await expressHandler(event, context);
  if (!isRecord(result) || typeof result.statusCode !== 'number') {
    throw new Error('Express adapter returned an invalid response.');
  }

  const responseHeaders = new Headers();
  if (result.headers !== undefined) {
    if (!isRecord(result.headers)) throw new Error('Express adapter returned invalid response headers.');
    for (const [name, value] of Object.entries(result.headers)) {
      if (typeof value !== 'string') throw new Error(`Express adapter returned an invalid ${name} header.`);
      responseHeaders.append(name, value);
    }
  }

  if (result.multiValueHeaders !== undefined) {
    if (!isRecord(result.multiValueHeaders)) throw new Error('Express adapter returned invalid multi-value headers.');
    for (const [name, values] of Object.entries(result.multiValueHeaders)) {
      if (!Array.isArray(values) || !values.every((value) => typeof value === 'string')) {
        throw new Error(`Express adapter returned invalid multi-value ${name} headers.`);
      }
      for (const value of values) responseHeaders.append(name, value);
    }
  }

  const body = result.body;
  if (body !== undefined && body !== null && typeof body !== 'string') {
    throw new Error('Express adapter returned an invalid response body.');
  }
  const isBase64Encoded = result.isBase64Encoded === true;
  if (result.isBase64Encoded !== undefined && typeof result.isBase64Encoded !== 'boolean') {
    throw new Error('Express adapter returned an invalid body encoding flag.');
  }
  const responseBody = isBase64Encoded ? Buffer.from(body ?? '', 'base64') : body ?? null;

  return new Response(responseBody, {
    status: result.statusCode,
    headers: responseHeaders,
  });
}

export const GET = dispatch;
export const POST = dispatch;
export const PUT = dispatch;
export const PATCH = dispatch;
export const DELETE = dispatch;
export const OPTIONS = dispatch;
