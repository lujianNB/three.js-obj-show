具体使用步骤：
1.打开项目/example/test/文件夹注意里面三个文件的名称和后缀名
2.把你要演示的模型文件（mtl，obj，jpg）复制到/example/test/目录下
3.用文本编辑器打开index.html找到第123行 找到以下两行：
'meshFile': 'examples/test/bcc.obj'
'mtlFile': 'examples/test/bcc.mtl',
把“neutral.obj”和“neutral.mtl”替换为你copy到/example/test/目录下的对应文件的文件名
4.访问本地文件会有跨域，可以通过本地静态服务器解决，有anywhere和live-server方法