import { expect } from "expect";
import { listSources, _seedInitialSources, getNewsProcessingStatus, fetchAndProcessNews } from "./api";

async function testListSources() {
  // First, seed the initial sources
  await _seedInitialSources();
  
  // Then test if we can list them
  const sources = await listSources();
  
  // Verify we have sources
  expect(Array.isArray(sources)).toBe(true);
  expect(sources.length).toBeGreaterThan(0);
  
  // Verify source structure
  const firstSource = sources[0];
  expect(firstSource).toHaveProperty("id");
  expect(firstSource).toHaveProperty("name");
  expect(firstSource).toHaveProperty("url");
  expect(firstSource).toHaveProperty("isEnabled");
  expect(firstSource).toHaveProperty("type");
  
  return true;
}

async function testFetchAndProcessNewsWithNoKeywords() {
  // Try to fetch news with no keywords
  // This test doesn't need to modify the database directly
  const result = await fetchAndProcessNews();
  
  // Should return either a COMPLETED status with no task ID (if no keywords)
  // or a RUNNING status with a task ID (if there are keywords)
  if (result.status === "COMPLETED") {
    expect(result.taskId).toBeNull();
    expect(result.message).toBeTruthy();
  } else {
    expect(result.status).toBe("RUNNING");
    expect(result.taskId).toBeTruthy();
  }
  
  return true;
}

export async function _runApiTests() {
  const result = {
    passedTests: [] as string[],
    failedTests: [] as { name: string; error: string }[],
  };

  try {
    await testListSources();
    result.passedTests.push("testListSources");
  } catch (error) {
    result.failedTests.push({
      name: "testListSources",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
  
  try {
    await testFetchAndProcessNewsWithNoKeywords();
    result.passedTests.push("testFetchAndProcessNewsWithNoKeywords");
  } catch (error) {
    result.failedTests.push({
      name: "testFetchAndProcessNewsWithNoKeywords",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  return result;
}