编辑 demo 后，运行 ./sh/check.js 检查语言文件是否都正确。

修改 src/lib 后运行 ./test.sh，测试

# JS 代码规范

## 代码风格

- 简洁、优雅、高效，用最现代的 js 语法
- 拆分过长的函数，接口设计要低耦合、高内聚
- 多用数组+循环 / forEach / map，少写重复代码
- 简单代码不写函数注释，避免过度注释。复杂逻辑、特殊需求，用精炼的中文注释
- 重复代码抽象为函数，降低冗余，比如 `cosnt A=new Table({ style: { border: NO_BORDER } }), B=new Table({ style: { border: NO_BORDER } })`，可以写为 `const newTable=()=>new Table({ style: { border: NO_BORDER } }), A=newTable(), B=newTable()`
- 变量声明：合并多个连续的 `const` 声明为一个语句。要写 `const a=1, b=2, c=3;`，而不是分三行写
- 异步处理：用 `await`，禁止使用 `.then` 链式调用
- 不要自动生成处理异常代码，不自动写 `try...catch`（`try ... catch` 由人工维护，已有的 `try catch` 不要删除）
- 纯函数优先：只写纯函数，绝对不要写 class
- 用箭头函数 `const funcName = () => {}`，不使用 `function` 关键字(生成器除外)；如可用 .bind 绑定参数，就避免定义函数
- 代码复用：注重复用，多提取小函数，坚决避免出现大量类似或复制粘贴的代码结构
- 对象访问：优先使用解构赋值提取需要的属性，避免内部反复使用点号访问深层和嵌套属性，并合并重复的可选链判断
- 函数参数不要用对象，不写 `{a,b,c}`，写 `a, b, c`；如可选参数多，用[[配置项的数字,配置项],[配置项的数字,配置项],..] 这种范式，配置项用数字常量定义
- 多值返回，用数组 `[a,b,c]`，不是 `{a,b,c}`，如返回值超过3个，用数字常量定义位置含义
- 不用要字符串表示状态，用数字常量定义状态
- 不用字符串模板(``)，用字符串拼接(+)
- for 循环，如需序号，用 `++i` 而不是 `i++`
- 不用 console.error 用 @3-/log/ERR.js
- 不用 console.warn 用 @3-/log/WARN.js

## 命名规范

- 命名追求极简。使用尽量短但有意义的命名，比如：用 `rm` 而不是 `remove`、`delete`、`del`。但，亦要避免走极端，比如:不要用单个字母 `m` 替代 `map`
- 函数命名尽量只用动词，可以用一个单词表达，就不要用两个单词。名词用文件命名体现，如果有需要在文件名中加入动词，请名词在前，动词在后。比如：是 `profileSet.js` 而不是 `setProfile.js`
- 变量名: 使用下划线风格 (snake_case)，例如 `user_auth_token`
- 函数名: 使用小写驼峰风格 (camelCase)，例如 `userData`
- 函数参数: 如是回调函数，用小写驼峰命名，如 `onChange`
- 模块级常量定义用大写下划线风格 `UPPER_SNAKE_CASE`
- 不写 `get` 这类没意义前缀，如: 写 `cookieByHeader`，而不是 `getCookie`
- 全局/模块级常量：使用大写下划线风格 (UPPER_SNAKE_CASE)，例如 `CODE_TO_ID`、`ID_TO_LANG`

## 模块化机制

- 导入：按需精准导入函数，禁止直接导入整个模块（避免 `import * as x` 或导入大对象）
- 导出：禁止导出对象。以函数、变量为单元导出，比如 `export const X=1, abc=()=>{};`,尽量合并用一个 const + 逗号来声明导出的内容,如果一个文件只有一个函数，用 `export default`
- 除非需要内部调用 export default 的函数，否则避免先声明常量再在文件末尾导出
- 路径解析：获取当前目录路径时，必须使用 `import.meta.dirname`

## 错误

- 避免用字符串错误，尽量用 const 声明 常量错误代码
- 如需要返回错误的数据信息，用 [错误码,错误信息,...] 这种方式，错误信息不是文本描述，而是数值之类的(比如[FILE_OVERSIZE, file_size, max_size])
-

## 尽量用兼容浏览器的 API

- 加解密：强制使用原生的 Web Crypto API
- 二进制数据：处理二进制时，尽量统一使用 `Uint8Array`
