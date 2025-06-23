手动发布：

# 1. 提交所有更改
git add .
git commit -m "fix: 修复小问题 v3.0.1"

# 2. 运行测试
npm test

# 3. 构建项目
npm run build

# 4. 发布到NPM
npm publish

# 5. 创建Git标签
git tag v3.0.1
git push origin v3.0.1


发布后验证：
# 验证包是否成功发布
npm view @tjsglion/sso-client-sdk

# 测试安装
mkdir test-install && cd test-install
npm install @tjsglion/sso-client-sdk