# Census 2021 Data Analysis

## Overview
This project analyzes the Census 2021 data to uncover insights from Education and Occupation datasets.

## Table of Contents
1. [Introduction](#introduction)
2. [Data](#Data)
3. [Methodology](#methodology)
4. [Results](#results)
5. [Conclusions](#conclusions)

## Introduction
Census data plays a crucial role in shaping a country's infrastructure and policies, providing a comprehensive picture of the population, including demographic, economic, and social information. The 2021 Census marks a significant milestone in the history of data collection, leveraging advanced technology for digital data collection and processing to enhance accuracy and coverage.

Project Overview
This project aims to analyze the 2021 Census data to uncover insights into the employment landscape across different electoral wards. The analysis focuses on the correlation between educational qualifications and occupations, the impact of age demographics on employment rates, and the mismatch between the supply of qualified individuals and job opportunities.

### Project Aims and Objectives

#### Aim
Our primary aim in undertaking this project is to delve deep into the qualifications and occupations datasets from Census 2021 provided by the ONS. By analyzing the inherent correlations and trends between these two sets, we endeavor to:

- Analyze Qualification-Occupation Correlation: Examine how different levels of educational qualifications align with job roles, highlighting areas with significant mismatches.
- Identify outliers and their significance in the broader spectrum of the data.
- Impact of No Qualification on Employment Rates: Investigate the employment rates among individuals without formal qualifications.
- Explore the implications of qualification preferences like classroom-based education versus apprenticeship programs.
- Examine the predominant occupations inwards based on different types of qualifications.
- Assess the influence of higher education and specific occupations on employment rates in electoral wards.
- Identify potential mismatches or gaps between acquired qualifications and the jobs people eventually engage in.
- Create a machine learning model designed to predict an individual's chances of securing a job based on their qualifications and the patterns observed in the electoral ward data.

## Data
#### Data Acquisition
**Source Identification**: The foremost step involved pinpointing a reliable data source. The datasets have to be broad and relevant to the study. The Office for National Statistics (ONS) website, specifically the URL "[https://www.ons.gov.uk/](https://www.ons.gov.uk/)", was identified as a prime source due to its comprehensive nature and extensive coverage of the Census 2021 data.

#### Data Pre-processing
In this project, the data pre-processing phase was crucial to transform and prepare the datasets for subsequent analysis and model building. Below is a summary of the key steps undertaken during the data pre-processing:
1. Data Importation:

The datasets related to qualifications and occupations were imported from CSV files using Python's pandas library.

2. Data Transformation:

Pivoting Data Frames: The initial datasets were restructured into a pivot table format. This transformation allowed for more accessible representation and facilitated aggregating and comparing data across different categories and electoral wards.
Renaming Columns: Certain columns in the qualification datasets were renamed to ensure clarity and consistency. This step was essential for removing ambiguities and ensuring that the column names were succinct and self-explanatory. Unnecessary columns were removed, making the dataset more suitable for our analytical goals.

3. Data Integration:

The transformed datasets for qualifications and occupations were merged into a single dataset. This integration was based on the "Electoral wards and divisions" as the common identifier. The result was a consolidated dataset that brought together the crucial data points from both qualifications and occupations, paving the way for in-depth analyses.

## Methodology

This methodology section presents our structured approach to ensure robust and meaningful insights into achieving the project's aims and objectives.

#### Exploratory Data Analysis (EDA)
**Data Visualization**: Graphs, plots, and charts were employed to get a preliminary understanding of the data distributions, trends, and patterns.

**Statistical Analysis**: Key statistical measures were computed to understand the central tendencies, variations, and other characteristics of the data.

#### Advanced Data Analysis
**Correlation Analysis**: We extensively looked at the linear relationships between educational qualifications and occupational categories. This thorough analysis aimed to clarify the degree to which different educational backgrounds may impact or direct people towards particular professional fields.

**Cluster Analysis**: K-means clustering was employed, segmenting the data into clusters based on inherent similarities. This provided insights into how qualifications and job types naturally group together, revealing any mismatches.

### Methodology for Calculating Employment Rate
This is a key measure that gives us an idea of how many people in a particular area are working compared to those who are not. The employment rate is the ratio of the number of employed individuals to the total workforce (i.e., the sum of employed and not employed individuals). The formula we employed to determine this is:

Employmentate=(Number of Employed)/(Number of Employed+Number of Not Employed)

This method was widely used, including by respected organizations like the Office for National Statistics in 2019. This approach helps provide a clear picture of the employment situation in any given area.

### Employment-Based Ward Categorization
The methodology adopted in this study for classifying each ward into distinct categories — 'High', 'Medium', and 'Low' — is based on the employment rate of each ward. This categorization is given to the machine learning algorithm as the target feature.

#### 1. Determining the Thresholds for Categorization:
Instead of arbitrarily choosing cut-offs, we turned to statistical measures that would offer an objective way to segment the wards. Specifically, we calculated two crucial percentiles of the employment rate:
- The 33rd percentile is also known as the lower third. This value serves as the boundary between the 'Low' and 'Medium' categories.
- The 66th percentile, which is the upper third. This acts as the boundary separating the 'Medium' and 'High' categories.

#### 2. Categorizing the Wards:
With these thresholds established, we proceeded to categorize each ward based on its employment rate:
- Wards with employment rates exceeding the 66th percentile (upper threshold) were classified as 'High probability'. This suggests that a significant majority of their residents are employed.
- Wards with employment rates falling between the 33rd percentile (lower threshold) and the 66th percentile were designated as 'Medium probability'. This indicates a moderate level of employment among its residents.
- Wards that had employment rates below the 33rd percentile were labeled as 'Low probability'. These are areas that might require closer attention due to their lower employment figures.

## Results

## 1. Analysis of Correlation between Qualifications and Occupations
To investigate the relationship between qualifications and occupations within each electoral ward, a scatter plot was created showing the total number of qualifications against the total number of occupations.

![download (9)](https://github.com/ashishsumanth1/Data-Analysis-/assets/115171950/419ce348-3dfc-461e-a7d3-a34b42098820)

Key Insights:

Correlation Observation: The scatter plot indicated a noticeable trend, suggesting that areas with higher numbers of qualifications tend to have higher numbers of occupations, highlighting a potential correlation between the two datasets.

Outliers Analysis: Some wards, despite having many qualified individuals, showed lower employment rates. This could be due to high population density or a shortage of jobs relative to the number of qualified people.

Closer Examination:

Clusters: Distinct clusters of wards were noticeable, suggesting a concentration where both qualifications and occupations were high. This observation led to a hypothesis about common qualifications and occupations in these high-performing wards.

Segmentation Based on Thresholds: By setting thresholds (e.g., more than 10,000 total occupations and qualifications), the data was segmented to isolate top-performing wards for a detailed analysis.

High-Value Wards: Inwards with over 10,000 total occupations and qualifications, Level 4 qualifications and 'Professional occupations' were most common.

Mid-Value Wards: Inwards with 6,000 to 10,000 occupations and qualifications above 5,000, Level 4 qualifications and 'Professional occupations' were also prevalent but in lower numbers.

Conclusion:

The scatter plot guided focused inquiries into specific regions, helping to identify patterns and correlations between qualifications and occupations. By setting thresholds and segmenting the data, significant insights into the qualifications and occupations prevalent in high-performing wards were obtained. This analysis underscores the importance of matching educational achievements with appropriate job opportunities to address regional disparities 
effectively.

## 2. Impact of No Qualification on Employment Rates

To assess the impact of individuals without qualifications on employment rates, we performed a detailed analysis starting with the calculation of the "Total Population" for each ward by summing across all qualification categories. This approach provided a comprehensive view of the population spread across various qualification levels.

![download (15)](https://github.com/ashishsumanth1/Data-Analysis-/assets/115171950/ee92cc0c-da10-44f4-ace1-8faa5cc99aad)

Methodology:

Calculating the "No Qualification Ratio":

Derived by dividing the number of individuals without qualifications by the total population of each ward. This ratio offers a normalized measure, enabling precise comparisons among wards with varying population sizes.
Categorizing Wards:

Wards were categorized based on their "No Qualification Ratios".
For targeted examination, subsets like the top and bottom 1000 wards were chosen to explore the data further.

Findings:

Correlation Observation:

The analysis revealed that wards with lower "No Qualification Ratios" tend to have more favorable employment rates.
This suggests a positive correlation between higher educational attainment and better employment opportunities.

Insights:

Positive Correlation:

Wards with a lower "No Qualification Ratio" tend to have better employment rates, underscoring the link between education and employment opportunities.
Consideration of Socio-Economic Factors:

While there's a visible trend, other socio-economic factors should be considered before drawing definitive conclusions. Further analysis with varied datasets is warranted.
Potential Interventions:

Areas with high "No Qualification Ratios" might benefit from targeted interventions, such as educational outreach programs or vocational training to improve employment rates.
Conclusion:

The examination of "No Qualification Ratios" and employment rates highlights the importance of education in enhancing employment opportunities. By identifying and addressing areas with high ratios of individuals without qualifications, targeted interventions can be implemented to promote better employment outcomes, contributing to overall socio-economic development.

## 3. Educational Qualifications of Employed Individuals: A Brief Overview
In reviewing employment data from the electoral wards, we analyzed the qualifications of employed individuals. This analysis combined data from various occupational categories to provide a comprehensive view.

![download (8)](https://github.com/ashishsumanth1/Data-Analysis-/assets/115171950/fd5d041e-6b5e-452a-9d51-bc06f0410e4a)

Level 1 Qualifications: 16.85% of employed individuals have a Level 1 qualification. This group is likely suited for entry-level roles or positions that do not require advanced training.

Level 2 Qualifications: 23.38% of the workforce holds Level 2 qualifications. These individuals are equipped for roles that require some degree of specialization or additional training.

Level 3 Qualifications: 26.62% of employed individuals possess Level 3 qualifications. They potentially occupy mid-tier roles, which might be supervisory or require a deeper understanding of specific domains.

Level 4 Qualifications: Over half (56.10%) of the employed population holds Level 4 qualifications. This indicates a highly educated workforce, suitable for advanced roles that demand significant expertise, managerial skills, or strategic input.


## 4. Percentage Distribution of Classroom vs. Apprenticeship-Based Qualifications

Our analysis of the 2021 Census dataset focused on understanding the predominant modes of education and training. We compared traditional 'Classroom-based' qualifications with 'Apprenticeship-based' qualifications.

![download (3)](https://github.com/ashishsumanth1/Data-Analysis-/assets/115171950/690e99c5-5eeb-47d8-97f5-6f6ad2bae918)

Classroom-based Qualifications: The data revealed that 92.1% of respondents acquired their qualifications through traditional classroom settings. This highlights a strong reliance on formal educational institutions and structured academic curriculums for learning and skill acquisition.

Apprenticeship-based Qualifications: Only 7.9% of the total qualifications were obtained through apprenticeships, which combine on-the-job training with some classroom instruction. This approach is often associated with practical learning in specific trades or professions.

Understanding this distribution is crucial for shaping future educational strategies, curriculum designs, and employment programs. This distribution is visually represented in the pie chart in Figure IV.

Our analysis indicates that regions with a higher concentration of individuals possessing Level 4 qualifications tend to have a greater proportion of professionals, underscoring the significant impact of education on occupational trends.

## 5. Analysis of Dominant Occupations in Wards Based on Apprenticeship Qualifications
Our analysis focused on electoral wards with a significant number of individuals possessing apprenticeship qualifications to determine dominant occupational patterns.

![download (10)](https://github.com/ashishsumanth1/Data-Analysis-/assets/115171950/96352408-d09b-4a82-88cc-8843dd031459)


Key Insights:

Prevalence of Professional Occupations:

Professional occupations are the most prevalent in 2,585 wards with a high proportion of apprentices.
This suggests a successful transition from apprenticeship programs to professional roles, indicating alignment between apprenticeship training and professional sector demands.
These wards might host industries requiring professional expertise or institutions attracting such professionals.

Elementary Occupations:

Elementary occupations dominate in 678 wards.
This indicates diverse economic needs, with many regions relying on elementary job roles foundational to their local economies.
There might be a skill-to-job mismatch, where apprenticeship skills don't fully align with available job opportunities, leading to elementary occupations.
Skilled Trades & Caring Occupations:

Skilled Trades: These wards may house industries needing specialized trade skills, like manufacturing, construction, or artisanal crafts.
Service and Care: The prominence of care and service roles in certain wards indicates a demand driven by demographics, culture, or specific institutions like healthcare facilities.

Conclusion:
The occupational landscape in wards with high apprenticeship qualifications is diverse. While professional roles are prominent, elementary, skilled trade, and caring occupations are also significant. This diversity reflects the multifaceted nature of economic activities and varying apprenticeship program outcomes across regions. These insights can guide policymakers, educators, and industry leaders in tailoring apprenticeship programs to address local job market needs and understand the broader economic characteristics of these wards.

## 6. Influence of Higher Education and Professional Occupations on Employment Rates in Electoral Wards
Our analysis identified a distinct relationship between employment rates and the proportion of people with Level 4 qualifications and those in professional occupations.
![download (7)](https://github.com/ashishsumanth1/Data-Analysis-/assets/115171950/e3e64c4a-97c8-4ddf-adbf-efc37712e54d)

Methodology:

High Performing Wards: Top 25% in Level 4 qualifications and professional occupations.
Low Performing Wards: Bottom 10% in Level 4 qualifications and professional occupations.

Key Findings:

Higher Employment Rates: High-performing wards show an average employment rate of 0.62%, compared to 0.53% in low-performing wards. This 9% difference is statistically significant.
Economic Implications:

Higher employment rates indicate a robust economy, fueled by educated individuals in professional roles, which boosts local productivity and living standards. This is supported by Moretti (2004), highlighting the economic benefits of regions with more college-educated residents.
Our findings suggest that wards with more residents holding Level 4 qualifications and professional occupations enjoy better economic conditions and higher employment rates.

## 7. Demand-Supply Mismatch Between Qualification and Occupation

Our analysis focused on how educational qualifications align with job roles in the UK. This helps determine if the education system matches employment opportunities.

![image](https://github.com/ashishsumanth1/Data-Analysis-/assets/115171950/a5b5b89d-1f5a-4166-92a1-0ce2ea99c1cf)

![image](https://github.com/ashishsumanth1/Data-Analysis-/assets/115171950/bd9a9ae7-ae92-4a24-906b-8468ea91f109)

Approach:

Sources: Utilized UK Standard Occupational Classification (SOC) 2020 and International Standard Classification of Education (ISCED).
Steps:
Data Categorization: Grouped educational qualifications and job roles into levels.
Identifying Mismatches: Found gaps where education levels didn't match available jobs.
Visualization: Used line plots to show mismatches for each educational level.
Findings:

Mismatch Rates:
Level 4: 32.08%
Level 3: 28.41%
Level 2: 21.09%
Level 1: 18.42%
Conclusion:
Significant mismatches exist between qualifications and job roles, especially at higher education levels. Our findings highlight the need for better alignment between the education and employment sectors.

## 8. Age Demographics and Their Impact on Employment Rates
Introduction:
We expanded our dataset to include employment status and age demographics to uncover patterns and insights.

![download (11)](https://github.com/ashishsumanth1/Data-Analysis-/assets/115171950/06ba25ef-0472-4ab8-8ae4-be141450b97c)
![download (12)](https://github.com/ashishsumanth1/Data-Analysis-/assets/115171950/565b39f0-b0b5-45a3-a233-564ea50b575a)

Detailed Observations:

Younger Populations (24 to 34 years):
Higher employment rates.
Likely due to recent training and contemporary skills.
Older Demographics (50+ years):
Lower employment rates.
Many individuals are retired or nearing retirement.
Key Concepts:

Workforce Age Dynamics:
Younger wards benefit from an active workforce aligned with current job market demands.
Older wards show lower employment due to retirement.
Skill Relevance:
Younger individuals have relevant, up-to-date skills.
Older populations may face skill obsolescence.

## 9. Development of the Census 2021 Data Analysis Web Application

The 2021 Census dataset provided valuable insights into the employment landscape, revealing the impact of age, qualifications, and geographical differences on job availability. To make these insights accessible, we developed an interactive web application aimed at aiding recent graduates and job seekers.

9.1. Dash - Interactive Web-based Data Visualization

Framework: Built on Flask, Plotly.js, and React.js, Dash is ideal for creating interactive data visualization apps.
Layout: The application includes sections such as "Cluster Analysis," "Qualifications and Occupations Analysis," "Job Market Analysis by Qualification Level," "Demand-Supply Gap Analysis," and "Age Distribution Analysis."
Components: Used Dropdown and Graph components for interactive selections and visualizations.
Callbacks: Enabled dynamic graph updates based on user inputs, such as changing electoral wards or selecting qualification levels.
Plotly: Integrated for visualizing cluster analysis, qualifications, occupations, and age distributions.

9.2. Interactivity and User Experience

Cluster Analysis:

User Interaction: Users can select electoral wards to update a scatter plot showing qualifications and occupations clusters.
KMeans Clustering Algorithm: Identified three distinct clusters:
Blue Cluster (Low Occupations and Low Qualifications): Areas with low qualifications and low employment, possibly rural or with an older population.
Yellow Cluster (Medium Occupations and Medium Qualifications): Balanced areas, potentially suburban, with growth potential.
Red Cluster (High Occupations or High Qualifications): Likely urban centers with high qualifications and employment, indicating economic vibrancy.

![Screenshot 2023-08-11 113715](https://github.com/ashishsumanth1/Data-Analysis-/assets/115171950/e4387427-863d-43c9-8262-1d6105b07dc1)

## Conclusions

We have uncovered a variety of insights through our analysis of the ONS Census 2021 data, especially that related to qualifications and occupations. Our initial goal was to identify the relationships between these datasets.

Our first dive into the data unveiled intriguing correlations between qualification and occupation levels. However, certain outliers captured our attention. These outliers, which presented a higher qualification level yet lacked corresponding occupations, revealed that a significant 52% of them possessed Level 4 qualifications, while 27.24% engaged in professional occupations. Recognizing the data's value, we wisely chose to retain these outliers for further analysis.

We found a clear disparity in qualification levels among the employed after digging further into the employment data. The fact that level 4 qualifications are held by more than half of the employed population indicates that there is a significant trend of highly educated labor. Levels 1 to 3 qualifications, on the other hand, make up a significant component that represents a range of skill sets, from basic to specialized professions.

Our investigation revealed several key findings, one of which was the overwhelmingly strong preference for classroom-based education. A clear indication of the confidence and reliance people have on formal education is the fact that over 92% of respondents preferred traditional educational structures. A lot of people who did apprenticeships, which is like learning while working, end up in professional jobs. This shows that apprenticeships can be a good way to get into such roles. However, some people also end up in more basic jobs.

Higher education has proven benefits and an influence on job trends. It's interesting to see that wards with a significant proportion of Level 4 qualified people and professionals have an employment rate of 0.62%.

Despite the fact, that education frequently implies greater employment prospects, there is a clear disconnection, particularly for people with Level 4 qualifications. A sizable 32.08% of them find themselves in jobs that might not be appropriate for their level of academic achievement, raising the possibility of a demand-supply imbalance in the labour market.

The age group of 24 to 34 years old plays an important role in shaping employment trends. This shows the energy and potential of this age group in the workforce.
However our research went a step further than merely providing analytical insights. Using the Random Forest technique and the capabilities of machine learning, we created a predictive model to estimate the chance that a person would land a job in a user-specified ward. In addition to improving our understanding of employment trends across wards, our model offers job searchers useful information that will help them make decisions based on data-driven insights.



