library(ggplot2)
library(tidyverse)
library(dplyr)

dataset <- read.csv("~/Desktop/FootballData/Data/PL_23:24.csv")
filteredDataset <- dataset %>% select_if(~ !any(is.na(.)))

# TODO aggregate json events to metrics ####

