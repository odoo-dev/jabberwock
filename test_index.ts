// load all specs into one bundle
const testsContext = (require as any).context('./packages/', true, /.test.ts$/i);
testsContext.keys().forEach(testsContext);
