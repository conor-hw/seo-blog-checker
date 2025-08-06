
🎯 Goal
The AI agent should classify each article with a Quality Score (0–100) based on six weighted content dimensions. Each category is scored on a 1–100 scale and contributes to the final weighted score
Articles classification list: Blog Articles Analysis and AI Process.xlsx
 
🧠 1. EEAT Score (20%)
Evaluates trustworthiness, experience, and authority.

✅ Real user quotes or experiences 
✅ UGC or traveller contributions 
✅ Specialist insights (e.g., local guides, HW experts) 
✅ HW brand confidence markers (e.g., proprietary data, staff recommendations) 
✅ Author/attribution or source references 

 🔧 2. Technical Score (10%)
Assesses SEO integrity and structure.

✅ Metadata present and optimised 
✅ Logical heading structure (H1–H3) 
✅ No broken internal or external links 
✅ Schema, canonical, and hreflang present (if applicable) 
✅ Proper internal linking to HW pages 

 🎯 3. Relevance for User Score (20%)
Evaluates how well the article matches user needs and intent.

✅ Answers top queries or relevant search topics 
✅ Matches Gen Z interests (tone, hostels, experiences) 
✅ Adds genuine value: what to do, where to go, what to expect 
✅ Covers the topic comprehensively, not shallowly 

 ✍️ 4. Text Quality Score (10%)
Evaluates clarity, grammar, localisation, and Gen Z tone.

✅ Correct grammar and spelling 
✅ Clear formatting (short paras, bullets) 
✅ Localised terms or translations used naturally 
✅ Consistent Gen Z-appropriate tone and readability 

 🕒 5. Freshness Score (15%)
Measures how up-to-date and timely the content is.

✅ Updated within the last 6–12 months 
✅ Reflects current events, travel conditions, prices 
✅ Avoids references to outdated years (e.g., “In 2022…”) 
✅ Links point to current pages 
✅ Reflects seasonal accuracy (summer, festivals, etc.) 

 🤖 6. AI Optimisation Readiness Score (25%)
Evaluates structural readiness for AI enrichment and long-tail discovery.

✅ Includes structured FAQs or common questions 
✅ Targets long-tail or intent-specific keywords 
✅ Clean use of headings, lists, answer formats 
✅ Designed for snippet or voice search use 
✅ Opportunities for AI-based content enrichment (e.g., widgets, expandable lists, internal linking modules) 

📊 Final Quality Score Formula
Quality Score = (EEAT × 0.20) + (Technical × 0.10) + (Relevance × 0.20) + (Text Quality × 0.10) + (Freshness × 0.15) + (AI Optimisation Readiness × 0.25)

✅ MASTER PROMPT: AI AGENT FOR HOSTELWORLD BLOG CONTENT EVALUATION

 🔍 OBJECTIVE
The goal of this evaluation is to support the Hostelworld SEO and Content teams in identifying high-impact optimisation opportunities across the blog. Many blog articles are currently outdated, underperforming, or incomplete (e.g. lacking localisation or translations). By systematically reviewing both Top Performing and Low Performing articles through a detailed quality framework, we aim to:

Improve existing content instead of always creating new 
Increase organic performance, visibility, and especially conversion  
Align with AI-friendly content guidelines to appear in AIO features and chatbots  

 📌 HOW TO EXECUTE THIS TASK
The AI agent must evaluate two sets of blog articles:

Top Performing Articles  
Low Performing Articles  
Each article must be reviewed using a structured scoring system based on key quality dimensions, with the goal of understanding:

What makes top articles successful 
What’s missing in low-performing content 
How to best optimise underperforming articles for results  

 🧠 TASK INSTRUCTIONS
For each article, perform the following:

Score the article using the Evaluation Criteria for AI Agent (see below)  
Return an Excel output file with: Column A: URL of the article  
Column B: EEAT Score (0–100)  
Column C: Technical Score (0–100)  
Column D: Relevance for User Score (0–100)  
Column E: Text Quality Score (0–100)  
Column F: AI Optimisation Readiness Score (0–100)  
Column G: Freshness Score (0–100)  
Column H: Final Quality Score (weighted average of all previous scores)  
Column I: Recommendation: Optimize / Not Optimize
(If Final Quality Score < 75 → Recommend "Optimize")    

Return two grouped lists: Top Performing Articles – Best Features: What top content does well (recurring strengths: structure, EEAT, tone, etc.)  
Low Performing Articles – Improvement Needs: Common weaknesses or missing elements across underperformers    
For each article marked “Optimize”, generate a detailed improvement recommendation, including: Suggested fixes per score category (e.g., how to improve EEAT, Freshness, AI readiness) 
Missing content sections or FAQs 
Title/meta/heading improvements 
Suggestions for internal links, new quotes, content updates, tone adjustments 

 ✅ EVALUATION CRITERIA FOR AI AGENT
The AI agent should classify each article with a Quality Score (0–100) based on six weighted content dimensions. Each category is scored on a 1–100 scale.

 🧠 1. EEAT Score (20%)
Evaluates trustworthiness, experience, and authority.
✅ Real user quotes or experiences
✅ UGC or traveller contributions
✅ Specialist insights (e.g., local guides, HW experts)
✅ HW brand confidence markers (e.g., proprietary data, staff recommendations)
✅ Author/attribution or source references

 🔧 2. Technical Score (10%)
Assesses SEO integrity and structure.
✅ Metadata present and optimised
✅ Logical heading structure (H1–H3)
✅ No broken internal or external links
✅ Schema, canonical, and hreflang present (if applicable)
✅ Proper internal linking to HW pages

 🎯 3. Relevance for User Score (20%)
Evaluates how well the article matches user needs and intent.
✅ Answers top queries or relevant search topics
✅ Matches Gen Z interests (tone, hostels, experiences)
✅ Adds genuine value: what to do, where to go, what to expect
✅ Covers the topic comprehensively, not shallowly

 ✍️ 4. Text Quality Score (10%)
Evaluates clarity, grammar, localisation, and Gen Z tone.
✅ Correct grammar and spelling
✅ Clear formatting (short paras, bullets)
✅ Localised terms or translations used naturally
✅ Consistent Gen Z-appropriate tone and readability

 🤖 5. AI Optimisation Readiness Score (25%)
Evaluates structural readiness for AI enrichment and long-tail discovery.
✅ Includes structured FAQs or common questions
✅ Targets long-tail or intent-specific keywords
✅ Clean use of headings, lists, answer formats
✅ Designed for snippet or voice search use
✅ Opportunities for AI-based content enrichment (e.g., widgets, expandable lists, internal linking modules)

 🕒 6. Freshness Score (15%)
Measures how up-to-date and timely the content is.
✅ Content updated in the last 6–12 months
✅ References current year, upcoming events, or timely seasonal content
✅ Avoids outdated mentions (e.g., “2022 festivals”, old hostels)
✅ Services and locations mentioned are still open
✅ Signs of recent editorial activity (e.g., updated FAQs, metadata, added sections)

 📊 Final Score Formula
inal Quality Score =(EEAT × 0.20) +(Technical × 0.10) +(Relevance × 0.20) +(Text Quality × 0.10) +(AI Optimisation Readiness × 0.25) +(Freshness × 0.15)

 📦 Final Deliverables Summary

Excel file with article evaluations: Columns A–H: individual scores + final quality score 
Column I: final recommendation (“Optimize” / “Not Optimize”) 
Grouped summary lists: ✅ Top Performing Articles – Best Features  
❌ Low Performing Articles – Improvement Needs    
Detailed suggestions for each "Optimize" article: Specific improvement tasks by category 
Missing content or new sections to add 
Metadata/FAQ/headline rewrite suggestions 
Tone and structure fixes for Gen Z/AIO alignment 







