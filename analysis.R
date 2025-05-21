library(ggplot2)
library(dplyr)
library(jsonlite)

dataset <- read.csv("~/Desktop/FootballData/Data/PL_23:24.csv")
filteredDataset <- dataset %>% select_if(~ !any(is.na(.)))
filteredDataset$events <- lapply(filteredDataset$events, fromJSON)

ggplot(filteredDataset, aes(fill=as.factor(result), y=Offsides)) + 
  geom_boxplot() + facet_wrap(~ as.factor(location))

summary(filteredDataset[, 5:12])
