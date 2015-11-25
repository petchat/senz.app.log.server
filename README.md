# RawLog 的入口服务器

## 功能需求：
 - leancloud log.tracer中的Log class所有字段迁移
 - createInstallation迁移
 - Log数据渲染部分迁移，摒弃基于rabbitmq的架构。采用 ./demo_async.js的来渲染Log数据到RefinedLog数据库中。
 - 失败的object缓存到redis中，并定时将redis中的失败object进行渲染
 - 注意不要像rabbitmq那样分多个项目，代码冗余度高。尽量整合到一个文件夹或者文件中。通过Log的type来区分
 - ./apps/converter其实就是一个rabbitmq项目。
 - ./client部分是测试wilddog用。可删掉
 - loopback component能提供一个file container功能。目前没有需要。
