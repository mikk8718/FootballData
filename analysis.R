library(ggplot2)
library(dplyr)
library(jsonlite)

dataset <- read.csv("~/Desktop/FootballData/Data/PL_23:24.csv")
filteredDataset <- dataset %>% select_if(~ !any(is.na(.)))
filteredDataset$events <- lapply(filteredDataset$events, fromJSON)
