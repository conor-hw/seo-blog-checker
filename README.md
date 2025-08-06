# SEO Blog Checker

A Node.js-based script that automates SEO quality evaluation of WordPress blog posts using Google's Gemini AI. The tool extracts content via WordPress REST API, evaluates it against configurable criteria using Gemini AI, and generates detailed Markdown reports suitable for both technical and non-technical stakeholders.

##  Features

- **AI-Powered Evaluation**: Uses Google's Gemini 1.5 Flash for intelligent SEO analysis
- **WordPress Integration**: Fetches content directly from WordPress REST API
- **Configurable Criteria**: Support for multiple evaluation configurations
- **Batch Processing**: Process multiple posts efficiently with parallel processing
- **Multiple Report Formats**: Technical, executive, and content creator reports
- **Hostelworld-Specific**: Specialized evaluation criteria for travel content
- **Flexible Input**: Support for single posts, comma-separated lists, or file input

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x LTS or higher
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- WordPress site with REST API enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd seo-blog-checker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   WORDPRESS_BASE_URL=https://your-wordpress-site.com
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Test the setup**
   ```bash
   node test-wordpress.js
   ```

## 📖 Usage

### Single Post Evaluation

```bash
# Evaluate by slug
node src/index.js evaluate --slug "your-post-slug" --evaluation-config hostelworld

# Evaluate by ID
node src/index.js evaluate --id 123 --evaluation-config hostelworld
```

### Multiple Posts Evaluation

```bash
# Comma-separated slugs
node src/index.js evaluate --slugs "post1,post2,post3" --evaluation-config hostelworld

# From file (newline-separated slugs)
node src/index.js evaluate --file slugs.txt --evaluation-config hostelworld

# With custom batch size
node src/index.js evaluate --file slugs.txt --evaluation-config hostelworld --batch-size 5
```

### Configuration Options

```bash
# Use different extraction config
node src/index.js evaluate --slug "post-slug" --extraction-config seo-focused --evaluation-config hostelworld

# Use different evaluation config
node src/index.js evaluate --slug "post-slug" --evaluation-config technical-seo
```

## 📁 Project Structure
seo-blog-checker/
├── src/
│ ├── index.js # Main CLI entry point
│ ├── wordpress-client.js # WordPress API integration
│ ├── gemini-client.js # Gemini AI integration
│ ├── content-extractor.js # Content parsing logic
│ ├── report-generator.js # Markdown report creation
│ └── config-loader.js # Configuration management
├── config/
│ ├── extraction/
│ │ ├── default.json # Default extraction config
│ │ └── seo-focused.json # SEO-focused extraction
│ └── evaluation/
│ ├── default.yaml # Generic evaluation config
│ └── hostelworld.yaml # Hostelworld-specific config
├── reports/ # Generated reports
├── tests/ # Test files
└── docs/ # Documentation


## ⚙️ Configuration

### Extraction Configuration

Define which parts of the WordPress API response to extract:

```json
{
  "title": true,
  "content": true,
  "excerpt": true,
  "meta_description": true,
  "keywords": true,
  "author": false,
  "date": false,
  "categories": true,
  "tags": true
}
```

### Evaluation Configuration

#### Generic Evaluation (default.yaml)
```yaml
evaluation_criteria:
  - keyword_density:
      target: 2.5
      weight: 0.3
  - readability:
      target_score: 60
      weight: 0.2
  - heading_structure:
      required_levels: ["h1", "h2", "h3"]
      weight: 0.2
  - meta_tags:
      required: ["title", "description"]
      weight: 0.3

output_format:
  include_score: true
  include_recommendations: true
  include_examples: true
  include_raw_data: false
```

#### Hostelworld Evaluation (hostelworld.yaml)
```yaml
evaluation_criteria:
  - eeat_score:
      weight: 0.20
      description: "Evaluates trustworthiness, experience, and authority"
  - technical_score:
      weight: 0.10
      description: "Assesses SEO integrity and structure"
  - relevance_score:
      weight: 0.20
      description: "Evaluates user needs and intent match"
  - text_quality_score:
      weight: 0.10
      description: "Evaluates clarity, grammar, and Gen Z tone"
  - ai_optimization_score:
      weight: 0.25
      description: "Evaluates AI readiness and long-tail discovery"
  - freshness_score:
      weight: 0.15
      description: "Measures content timeliness"

output_format:
  include_score: true
  include_recommendations: true
  include_examples: true
  include_raw_data: false
  report_type: "hostelworld"
  optimization_threshold: 75
```

## 📊 Report Output

Reports are generated in organized folders:
reports/
├── post-slug/
│ ├── seo-analysis-report.md # Detailed technical report
│ ├── executive-summary.md # High-level summary
│ ├── content-creator-guide.md # Actionable tips
│ ├── metadata.json # Report metadata
│ └── raw-evaluation.json # Raw AI evaluation data


### Report Types

1. **Technical Report**: Comprehensive analysis for SEO specialists
2. **Executive Summary**: High-level overview for managers
3. **Content Creator Guide**: Actionable tips for writers

## 🔧 CLI Options

| Option | Description | Example |
|--------|-------------|---------|
| `--slug` | Single post slug | `--slug "post-title"` |
| `--id` | Single post ID | `--id 123` |
| `--slugs` | Comma-separated slugs | `--slugs "post1,post2,post3"` |
| `--ids` | Comma-separated IDs | `--ids "1,2,3"` |
| `--file` | File with newline-separated slugs | `--file slugs.txt` |
| `--extraction-config` | Extraction configuration | `--extraction-config seo-focused` |
| `--evaluation-config` | Evaluation configuration | `--evaluation-config hostelworld` |
| `--batch-size` | Parallel processing batch size | `--batch-size 5` |

## 📝 Input File Format

Create a text file with one slug per line:

```text
best-traditional-canadian-food
how-to-backpack-europe
budget-travel-tips
solo-travel-guide
hostel-etiquette
```

Lines starting with `#` are treated as comments and ignored.

## 🧪 Testing

### Test WordPress Integration
```bash
node test-wordpress.js
```

### Test Full Integration
```bash
node test-integration.js
```

### Test Hostelworld Evaluation
```bash
node test-hostelworld-evaluation.js
```

### Test Batch Processing
```bash
node test-batch-processing.js
```

## 🎯 Hostelworld-Specific Features

### Evaluation Dimensions

1. **EEAT Score (20%)**: Trustworthiness, experience, authority
   - Real user quotes/experiences
   - UGC or traveller contributions
   - Specialist insights (local guides, HW experts)
   - HW brand confidence markers

2. **Technical Score (10%)**: SEO integrity and structure
   - Metadata optimization
   - Heading structure (H1-H3)
   - Internal linking to HW pages
   - Schema markup

3. **Relevance Score (20%)**: User needs and intent
   - Answers top queries
   - Matches Gen Z interests
   - Comprehensive coverage
   - Genuine value

4. **Text Quality Score (10%)**: Clarity and tone
   - Grammar and spelling
   - Gen Z-appropriate tone
   - Clear formatting
   - Localized terms

5. **AI Optimization Score (25%)**: AI readiness
   - Structured FAQs
   - Long-tail keywords
   - Snippet/voice search ready
   - AI enrichment opportunities

6. **Freshness Score (15%)**: Content timeliness
   - Recent updates (6-12 months)
   - Current events/conditions
   - No outdated references
   - Seasonal accuracy

### Scoring Formula
Final Score = (EEAT × 0.20) + (Technical × 0.10) + (Relevance × 0.20) +
(Text Quality × 0.10) + (AI Optimization × 0.25) + (Freshness × 0.15)


## 🚨 Error Handling

The script handles various error scenarios:

- **WordPress API errors**: Connection issues, 404s, rate limits
- **Gemini API errors**: Rate limits, invalid requests, quota exceeded
- **Configuration errors**: Missing files, invalid formats
- **File system errors**: Permission issues, disk space

Failed posts are logged but don't stop the batch processing.

## 📈 Performance

- **Single post**: ~30 seconds
- **Batch processing**: Configurable parallel processing
- **Default batch size**: 3 concurrent requests
- **Memory usage**: Minimal, processes one post at a time

## 🔒 Security

- API keys stored in environment variables
- No sensitive data logged
- Input validation for all parameters
- Safe file operations with proper error handling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Common Issues

**WordPress API Connection Failed**
- Verify `WORDPRESS_BASE_URL` is correct
- Check if REST API is enabled
- Ensure the site is accessible

**Gemini API Errors**
- Verify `GEMINI_API_KEY` is valid
- Check API quota limits
- Ensure the key has proper permissions

**Configuration File Errors**
- Validate JSON/YAML syntax
- Check file paths are correct
- Ensure required fields are present

**Batch Processing Slow**
- Reduce `--batch-size` value
- Check network connectivity
- Monitor API rate limits

### Getting Help

- Check the test files for examples
- Review the configuration files
- Run individual tests to isolate issues
- Check the generated logs for detailed error messages

---

**Built for Hostelworld SEO and Content teams** ��✈️