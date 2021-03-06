const { ApolloServer, gql, makeExecutableSchema } = require("apollo-server");
const { Prisma } = require("prisma-binding");
const {EmailAddress, PostalCode} =  require("@okgrow/graphql-scalars");
const Query = require("./resolvers/Query");
const Mutation = require("./resolvers/Mutations");
const {PhoneNumber} = require("./resolvers/Scalars");
const config = require("./config");
const AuthDirectives = require("./Auth/Directives");
const fs = require("fs");
const { connectMessageQueueListener } = require("./Service_Mesh/listener_connector");
const { connectMessageQueuePublisher } = require("./Service_Mesh/publisher_connector");
const introspect = require("./Auth/introspection");

const resolvers = {
  Query,
  Mutation,
  Email : EmailAddress,
  PhoneNumber,
  PostalCode
};

const typeDefs = gql`${fs.readFileSync(__dirname.concat("/schema.graphql"), "utf8")}`;

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives: {
    isAuthenticated: AuthDirectives.AuthenticatedDirective,
    inOrganization: AuthDirectives.OrganizationDirective,
    isSameTeam: AuthDirectives.SameTeamDirective,
    isSupervisor: AuthDirectives.SupervisorDirective,
    isOwner: AuthDirectives.OwnerDirective,    
  },
  resolverValidationOptions: {
    requireResolversForResolveType: false
  }
});

const server = new ApolloServer({
  schema,
  engine: {
      apiKey: config.engine.apiID,
  },
  tracing: config.app.tracing, 
  context: async (req) => ({
    ...req,
    prisma: new Prisma({
      typeDefs: "./src/generated/prisma.graphql",
      endpoint: "http://"+config.prisma.host+":4466/profile/",
      debug: config.prisma.debug,
    }),
    token: await introspect.verifyToken(req),
  }),
});



server.listen().then(({ url }) => {
  // eslint-disable-next-line no-console
  console.info(`🚀 GraphQL Server ready at ${url}`);
});

// Lauch process to listen to service message queue
if (config.rabbitMQ.user && config.rabbitMQ.password){
  connectMessageQueueListener();
  connectMessageQueuePublisher();
}

