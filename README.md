# JABIL Wheels & Rims — Netlify 适配版

基于线上第 9 版，原始提交：`8dd1c3e9a462567f8beed93aa928cd6f06ceefd0`。
此目录即 Git 仓库根目录。英文、西班牙语、俄语页面、产品图片、目录 PDF、产品参数、筛选、询价篮和四位销售联系方式已包含。

## 一、上传 Git 仓库

解压后，将本目录中的文件上传到新仓库，保持 netlify.toml、package.json、site、scripts 在仓库根目录，不要再套一层文件夹。
如使用命令行，在本目录执行：

```sh
git init
git add .
git commit -m "Initial JABIL Wheels website"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

YOUR_REPOSITORY_URL 替换为你新建的 GitHub 仓库地址。
当前仍使用临时参考产品图，建议先建私有仓库。

## 二、Netlify 导入仓库

1. Netlify 选择 Import an existing project，连接 GitHub 并选择该仓库。
2. Base directory 留空；Build command：npm run build；Publish directory：dist。
3. Node 22 已在 netlify.toml 指定，无额外 npm 依赖。
4. 首次部署后进入项目 Forms，启用 Enable form detection，然后重新部署。
5. 确认 Forms 中出现 wheel-enquiry。提交一次带附件、含产品和数量的测试，并到 Forms 的 Verified/Spam 栏确认收到。
6. 如需邮件通知，在 Forms > Submission notifications 添加 info@jabiltyre.com。平台功能/用量以你的 Netlify 套餐为准，源码不会自动配置通知。

如改用自定义域名，可在 Netlify 环境变量设置 SITE_URL=https://你的域名 后重新构建；未设置时使用 Netlify 的生产环境 URL。构建会同步替换 canonical、hreflang、站点地图中的原域名。
不使用 /* /index.html 200 的单页回退，避免破坏多页路径和表单。

## 三、与原站后端的区别

- 本版用 Netlify Forms 接收询价和附件，记录在你的 Netlify 项目中。
- 附件调整为最多 3 个独立上传字段，合计上限 7 MB，为 Netlify 的 8 MB 请求上限留出空间。
- 显示的 Tracking reference 是客户端生成的跟踪编号，不是 Netlify 返回的提交 ID。部署后必须核对 Forms 实际收件。
- 原 Cloudflare D1/R2 数据、已有询价和已上传文件不会自动迁移。
- 原 /admin/enquiries 销售分配后台和 ChatGPT 登录仅在原平台有效，本适配版不包含等效后台；请在 Netlify Forms 查看提交。如需原样保留销售分配、私有附件权限和跟进状态，需要另行迁移后端。
- Netlify Forms 的附件访问机制不等同于原站私有 R2。涉及保密图纸时先确认接收与权限方案。
- 完整原始后端源代码、数据库 schema 与迁移文件在另一个 Original-Source-v9.zip 中。
- 本包不包含任何真实询价数据、邮件服务密钥、登录凭据或 .git 历史。

## 四、文件位置与本地检查

- site/en、site/es、site/ru：三种语言页面源文件，直接修改后提交即可。
- site/assets：产品图和目录。
- site/product-models.json：产品及变体数据。
- site/enquiry-client.js：筛选、询价篮与 Netlify Forms 提交。
- site/_redirects：114 条旧地址跳转，加首页跳转。
- site/_headers：基础响应头，保留 noindex/nofollow。

```sh
npm run check
npm run build
```

dist 是构建产物，不提交 Git。若使用拖拽部署，应上传 dist 内的网站内容。只在本机静态预览不会接收 Netlify Forms。
目前保留预览阶段 noindex/nofollow、robots.txt 禁止收录和参考图说明。真实素材与资料确认后，再统一调整 HTML robots meta、_headers 和 robots.txt，开放搜索收录。

## 五、验证范围

已验证源码版本、静态文件打包、表单字段、附件字段和构建过程。尚未连接你的 Netlify 账号，未在 Netlify 实际发布或验证收件。
原站保持不变：https://equipment-wheel-supply.joylee624.chatgpt.site/en/

官方资料：
- https://docs.netlify.com/manage/forms/setup/
- https://docs.netlify.com/manage/forms/notifications/
