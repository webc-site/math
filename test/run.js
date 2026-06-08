import ERR from "@3-/log/ERR.js";

const run = async (name, cases) => {
  console.log("开始测试: " + name + " (" + cases.length + " 个用例)");
  let passed = 0,
    failed = 0;

  for (let i = 0; i < cases.length; ++i) {
    const { name: case_name, fn } = cases[i];
    try {
      await fn();
      ++passed;
    } catch (err) {
      ++failed;
      ERR("❌ 用例 [" + case_name + "] 失败: " + err.message);
    }
  }

  if (failed === 0) {
    console.log("✅ 测试 [" + name + "] 通过 (" + passed + "/" + passed + " 个用例)");
    return true;
  }
  ERR("❌ 测试 [" + name + "] 失败 (" + failed + " 个用例失败，" + passed + " 个通过)");
  return false;
};

export default run;
