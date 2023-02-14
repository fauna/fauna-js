import * as clientExercises from "./exercises/client-exercises";
import * as clientSolutions from "./solutions/client-solutions";
import * as queryExercises from "./exercises/query-exercises";
import * as querySolutions from "./solutions/query-solutions";
import { isDeepStrictEqual } from "node:util";
import { getSecret } from "./utils";
import { inspect } from "util";
import { diff } from "jest-diff";
const colors = require('@colors/colors/safe');
var Table = require('cli-table3');

inspect.defaultOptions.depth = null;

// make sure secret is set.
getSecret();

colors.setTheme({
  skipped: 'cyan',
  correct: 'green',
  wrong: 'red',
});

async function runExercises() {
  const tables = await Promise.all([
    runExercisesHelper(clientExercises, clientSolutions, "Client"),
    runExercisesHelper(queryExercises, querySolutions, "Query")
  ]);
  for (let table of tables) {
    console.log(table.toString());
  }
}

async function runExercisesHelper(exercises: object, solutions: object, headerName: "Query" | "Client") {
  const pendingRuns = [];
  for (let exercise of Object.keys(exercises)) {
    // @ts-ignore
    pendingRuns.push(evaluateExercise(exercises[exercise], solutions[exercise], exercise, headerName));
  }
  const results = await Promise.all(pendingRuns);
  const head = [colors.bold.blue(`${headerName} Exercise`), colors.bold.blue('Result')];
  const table = new Table({head});
  for (let result of results) {
    table.push(result);
  }
  return table;
}


async function evaluateExercise(actual: any, expected: any, exerciseName: string, exerciseType: "Query" | "Client") {
  let actualValue = await actual();
  let expectedValue = await expected();
  if (["constructingClients", "defaultHeaders"].includes(exerciseName)) {
    actualValue = actualValue === undefined ? actualValue : actualValue.clientConfiguration;
    expectedValue = expectedValue.clientConfiguration;
  }
  let incorrectDiff: string | null = null;
  let result: [string, string];
  if (actualValue == undefined) {
    result = [exerciseName, colors.skipped('Skipped')];
  } else if (exerciseType === "Query") {
    if (exerciseName === "correctingErrors") {
      expectedValue = expectedValue.map((v: any) => v.data);
      actualValue = actualValue.map((v: any) => v.data);
      if (isDeepStrictEqual(actualValue, expectedValue)) {
        result = [exerciseName, colors.correct("Correct!")];
      } {
        result = [exerciseName, colors.wrong("Incorrect, please try again!")];
        incorrectDiff = diff(expectedValue, actualValue);
      }
    } else if (isDeepStrictEqual(actualValue.data, expectedValue.data)) {
      result = [exerciseName, colors.correct("Correct!")];
    } else {
      result = [exerciseName, colors.wrong("Incorrect, please try again!")];
      incorrectDiff = diff(expectedValue.data, actualValue.data);
    }
  } else {
    if (isDeepStrictEqual(actualValue, expectedValue)) {
      result = [exerciseName, colors.correct("Correct!")];
    } else {
      result = [exerciseName, colors.wrong("Incorrect, please try again!")];
      incorrectDiff = diff(expectedValue, actualValue);
    }
  }
  if (incorrectDiff !== null) {
    console.log(`\n${exerciseName} is incorrect:\n`, incorrectDiff, '\n');
  }
  return result;
}

runExercises().then(_ => console.log(colors.correct(`Thank you for trying FQL X!`)));
