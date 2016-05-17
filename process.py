import json
from shapely.geometry import shape, Point
import math
import csv
import pprint
#make msa to tract dictionary
#calculate msa scores
#calculate tract scores
#average tract scores by msa


##['cityNumber', 'cityName', '1', '2', '3', '4', '5', '6', '7', '8', '9']

def main():
    
    with open('data/MSAs_NightLights.csv', 'Ur') as f:
        csvReader = csv.reader(f)
        for row in csvReader:
            cityName = row[1]
            group = 1
            for c in row[2:]:
                print [cityName, group, c]
                group+=1
            
main()