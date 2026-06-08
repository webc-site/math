#!/usr/bin/env -S bun test
import { test } from "bun:test";
import cases from "./compare.js";

for (const { name, fn } of cases()) {
  test(name, fn);
}
