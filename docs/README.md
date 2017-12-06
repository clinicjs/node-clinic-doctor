
# Model Development

This directory contains some internal documentation and code for developing
the models.

## Dependencies

Have `pandoc` and `R` installed with the following packages:

```R
install.packages("knitr")
install.packages("ggplot2")
install.packages("scales")
install.packages("plyr")
```

## Compile Rmd

The models are documented in `.Rmd` files. These are Markdown files with
embedded R code. The embedded R code is executed an the result is inlined
in the Markdown.

It is recommended to use `RStudio` or similar tool for deveoping them. If
you just want to compile them you can run:

```sh
Rscript -e "library(knitr); rmarkdown::render('slow-io.detector.Rmd')"
```
