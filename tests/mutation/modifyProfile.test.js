/* eslint-disable no-undefined */
/* eslint-disable no-use-before-define */
const{makeExecutableSchema} = require("graphql-tools");
const { graphql } = require("graphql");
const {Country, Province, PhoneNumber} = require("../../src/resolvers/Scalars");
const fs = require("fs");
const path = require("path");
const Mutation = require("../../src/resolvers/Mutations");
const assert = require("chai").assert;
const helpers = require("../test_helpers");

var schema;
describe("Modify existing profile", () =>{
    beforeEach(() =>{
        const resolvers = {Mutation, PhoneNumber, Country, Province};
        const typeDefs = fs.readFileSync(path.join(__dirname, "../../src", "schema.graphql"), "utf8");
        schema = makeExecutableSchema({
            typeDefs: typeDefs + `
            type Address {
                id: ID!
                streetAddress: String!
                city: String!
                province: String!
                postalCode: String!
                country: String!
              }
            `,
            resolvers
          });
    }),
    it("throws exception when gcId return NULL profile", async () =>{
        var query = `
        mutation
        {
            modifyProfile(gcId:"9999"){name}
        }`;
        await graphql(schema, query, null, contextWithProfileNUll()).then((result) =>{
            helpers.expectOneErrorWithText(result.errors, "Could not find profile with gcId ${args.gcId}");
        });
    }),
    it("throws exception when gcId return UNDEFINED profile", async () =>{
        var query = `
        mutation
        {
            modifyProfile(gcId:"9999"){name}
        }`;
        await graphql(schema, query, null, contextWithProfileUndefined()).then((result) =>{
            helpers.expectOneErrorWithText(result.errors, "Could not find profile with gcId ${args.gcId}");
        });
    }),
    it("save properly with all valid information", async () =>{
        var query = `
        mutation
        {
            modifyProfile(gcId:"9999"){name}
        }`;
        await graphql(schema, query, null, contextWithExistingProfile()).then((result) =>{
            helpers.expectNoErrors(result.errors, "Could not find profile with gcId ${args.gcId}");
        });
    });
});

function contextWithExistingProfile() {
    return {prisma:{
        Profile(){
            return {};
        },
        mutation:{
            updateProfile(){
                return {
                    name: "updated",
                };
            }
        }
    }};
}

function contextWithProfileNUll() {
    return {prisma:{
        Profile(){
            return null;
        }
    }};
}

function contextWithProfileUndefined() {
    return {prisma:{
        Profile(){
            return undefined;
        }
    }};
}

function executeGraphQL(schema, query, context) {
    return graphql(schema, query,null, context).then((result) =>{
        var errors = result.errors;
        if(errors) {
            assert.equal(errors.length, 0, errors);
        }
    });
}