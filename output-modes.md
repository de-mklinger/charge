# Output Modes

## Legacy:

```
Input file:  index.html.mdx
Output file: index.html
path:        /
```

```
Input file:  something.html.mdx
Output file: something.html
path:        /something
```

```
Input file:  foo/index.html.mdx
Output file: foo/index.html
path:        /foo/index
```

```
Input file:  foo/something.html.mdx
Output file: foo/something.html
path:        /foo/something
```

## Fixed Legacy

```
Input file:  index.html.mdx
Output file: index.html
path:        /
```

```
Input file:  something.html.mdx
Output file: something.html
path:        /something
```

```
Input file:  foo/index.html.mdx
Output file: foo/index.html
path:        /foo/ 🆕
```

```
Input file:  foo/something.html.mdx
Output file: foo/something.html
path:        /foo/something
```

## Plain

```
Input file:  index.html.mdx
Output file: index.html
path:        /
```

```
Input file:  something.html.mdx
Output file: something.html
path:        /something.html 🆕
```

```
Input file:  foo/index.html.mdx
Output file: foo/index.html
path:        /foo/ 🆕
```

```
Input file:  foo/something.html.mdx
Output file: foo/something.html
path:        /foo/something.html 🆕
```

## Index Files / Directories

```
Input file:  index.html.mdx
Output file: index.html
path:        /
```

```
Input file:  something.html.mdx
Output file: something/index.html 🆕
path:        /something/ 🆕
```

This may collide with input file `something/index.html.mdx`!

```
Input file:  foo/index.html.mdx
Output file: foo/index.html
path:        /foo/ 🆕
```

```
Input file:  foo/something.html.mdx
Output file: foo/something/index.html 🆕
path:        /foo/something/ 🆕
```
