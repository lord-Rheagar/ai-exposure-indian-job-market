import { openai } from "@workspace/integrations-openai-ai-server";
import { batchProcess } from "@workspace/integrations-openai-ai-server/batch";
import fs from "fs";
import path from "path";

interface Occupation {
  title: string;
  slug: string;
  category: string;
  pay: number;
  jobs: number;
  outlook: number;
  outlook_desc: string;
  education: string;
  exposure: number;
  exposure_rationale: string;
  url: string;
}

const CATEGORIES = [
  {
    name: "information-technology",
    occupations: [
      "Software Developers", "Data Scientists", "IT Support Specialists", "Database Administrators",
      "Network Administrators", "Cybersecurity Analysts", "Web Developers", "Systems Analysts",
      "Cloud Computing Specialists", "AI and Machine Learning Engineers", "Mobile App Developers",
      "DevOps Engineers", "UI/UX Designers", "Quality Assurance Testers", "IT Project Managers",
      "Computer Hardware Engineers", "Blockchain Developers", "Data Engineers"
    ]
  },
  {
    name: "healthcare",
    occupations: [
      "Physicians and Surgeons", "Nurses (Staff Nurses)", "Pharmacists", "Dentists",
      "Physiotherapists", "Lab Technicians (Medical)", "Radiologists", "Ayurvedic Practitioners",
      "Community Health Workers (ASHA)", "Paramedics and EMTs", "Hospital Administrators",
      "Optometrists", "Veterinarians", "Nutritionists and Dietitians", "Medical Transcriptionists",
      "Psychiatric Counsellors"
    ]
  },
  {
    name: "education",
    occupations: [
      "School Teachers (Primary)", "School Teachers (Secondary)", "College Professors",
      "Private Tutors", "Special Education Teachers", "Education Administrators",
      "Vocational Trainers", "Anganwadi Workers", "University Researchers",
      "Education Technology Specialists", "Librarians", "Sports Coaches (School)"
    ]
  },
  {
    name: "agriculture",
    occupations: [
      "Farmers (Crop Cultivation)", "Agricultural Labourers", "Dairy Farmers",
      "Fishermen and Aquaculture Workers", "Horticulturists", "Agricultural Scientists",
      "Plantation Workers", "Poultry Farmers", "Agricultural Extension Officers",
      "Sericulture Workers", "Forestry Workers", "Beekeepers"
    ]
  },
  {
    name: "manufacturing",
    occupations: [
      "Factory Workers (Assembly Line)", "Textile Workers", "Welders and Fabricators",
      "CNC Machine Operators", "Quality Control Inspectors", "Industrial Engineers",
      "Pharmaceutical Manufacturing Workers", "Automobile Assembly Workers",
      "Electronics Assembly Workers", "Food Processing Workers", "Packaging Workers",
      "Plant Managers", "Tool and Die Makers", "Chemical Plant Operators"
    ]
  },
  {
    name: "construction",
    occupations: [
      "Construction Labourers", "Masons and Bricklayers", "Carpenters",
      "Plumbers", "Electricians", "Civil Engineers", "Architects",
      "Crane Operators", "Interior Designers", "Surveyors",
      "Painting and Finishing Workers", "Steel Fixers"
    ]
  },
  {
    name: "finance-and-business",
    occupations: [
      "Chartered Accountants", "Bank Clerks", "Financial Analysts",
      "Insurance Agents", "Stock Brokers", "Tax Consultants",
      "Management Consultants", "Auditors", "Loan Officers",
      "Investment Bankers", "Actuaries", "Company Secretaries",
      "Real Estate Agents", "Business Analysts"
    ]
  },
  {
    name: "government-and-defense",
    occupations: [
      "IAS Officers (Civil Services)", "Police Officers", "Military Personnel",
      "Government Clerks", "Postal Workers", "Railway Workers",
      "Customs Officers", "Tax Revenue Officers", "Judges and Magistrates",
      "Firefighters", "Intelligence Officers", "Diplomats (IFS)"
    ]
  },
  {
    name: "transport-and-logistics",
    occupations: [
      "Truck Drivers", "Auto/Taxi Drivers", "Railway Engine Drivers",
      "Delivery Executives", "Airline Pilots", "Ship Crew Members",
      "Warehouse Workers", "Logistics Coordinators", "Bus Drivers",
      "Traffic Controllers", "Freight Forwarders", "Supply Chain Managers"
    ]
  },
  {
    name: "retail-and-hospitality",
    occupations: [
      "Shop Keepers and Retail Workers", "Hotel Managers", "Chefs and Cooks",
      "Waiters and Restaurant Staff", "Tour Guides", "Travel Agents",
      "Housekeeping Staff", "Barbers and Beauty Professionals",
      "Event Managers", "Street Vendors", "E-commerce Sellers",
      "Customer Service Representatives"
    ]
  },
  {
    name: "media-and-entertainment",
    occupations: [
      "Journalists", "Television Anchors", "Film Directors",
      "Actors and Performers", "Graphic Designers", "Photographers",
      "Content Writers and Copywriters", "Video Editors",
      "Radio Jockeys", "Social Media Managers", "Music Directors and Composers",
      "Animators"
    ]
  },
  {
    name: "legal",
    occupations: [
      "Advocates (Lawyers)", "Legal Advisors (Corporate)", "Paralegals",
      "Court Clerks", "Notaries", "Patent Attorneys",
      "Mediators and Arbitrators"
    ]
  },
  {
    name: "science-and-research",
    occupations: [
      "Research Scientists", "Environmental Scientists", "Biotechnologists",
      "Space Scientists (ISRO)", "Chemists", "Geologists",
      "Meteorologists", "Statisticians", "Mathematicians"
    ]
  },
  {
    name: "skilled-trades",
    occupations: [
      "Tailors and Garment Workers", "Potters and Ceramics Workers",
      "Jewellers and Goldsmiths", "Handloom Weavers", "Leather Workers",
      "Blacksmiths", "Auto Mechanics", "Air Conditioning Technicians",
      "Mobile Phone Repair Technicians", "Solar Panel Installers"
    ]
  },
  {
    name: "domestic-and-personal-services",
    occupations: [
      "Domestic Workers (Housemaids)", "Washermen (Dhobis)",
      "Security Guards", "Drivers (Personal)", "Sanitation Workers",
      "Cooks (Household)", "Childcare Workers (Ayahs)", "Yoga Instructors"
    ]
  }
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function generateOccupationData(
  category: string,
  occupations: string[]
): Promise<Occupation[]> {
  const prompt = `You are an expert on the Indian labor market. For each occupation listed below, provide a JSON object with these fields:
- "title": the occupation name as given
- "pay": realistic annual median pay in INR (Indian Rupees). Use data from PLFS, Glassdoor India, PayScale India, or your best estimate for 2024.
- "jobs": estimated number of workers in India (use PLFS 2023-24 data, Census 2011 extrapolations, or best estimates). Must be a realistic number.
- "outlook": estimated job growth percentage over next 10 years (can be negative for declining occupations)
- "outlook_desc": one of "Decline", "Little or no change", "Slower than average", "As fast as average", "Faster than average", "Much faster than average"
- "education": typical minimum education required, one of: "No formal education", "Below primary", "Primary school", "Middle school", "Secondary (10th)", "Higher secondary (12th)", "ITI/Diploma", "Some college, no degree", "Bachelor's degree", "Master's degree", "Doctoral/Professional degree"
- "exposure": AI exposure score from 0-10. 0 = no AI impact, 10 = fully automatable by AI. Consider how much core tasks can be done by AI/automation.
- "exposure_rationale": 2-3 sentence explanation of why this score, specific to Indian context. Mention specific tasks that are/aren't automatable.

Category: ${category}
Occupations: ${JSON.stringify(occupations)}

Respond with ONLY a valid JSON array of objects. No markdown, no code blocks, just the raw JSON array.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 8192,
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content ?? "[]";
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as Array<{
      title: string;
      pay: number;
      jobs: number;
      outlook: number;
      outlook_desc: string;
      education: string;
      exposure: number;
      exposure_rationale: string;
    }>;

    return parsed.map((item) => ({
      title: item.title,
      slug: slugify(item.title),
      category,
      pay: item.pay,
      jobs: item.jobs,
      outlook: item.outlook,
      outlook_desc: item.outlook_desc,
      education: item.education,
      exposure: item.exposure,
      exposure_rationale: item.exposure_rationale,
      url: "",
    }));
  } catch (e) {
    console.error(`Failed to parse response for category ${category}:`, e);
    console.error("Raw content:", content.slice(0, 200));
    return [];
  }
}

async function main() {
  console.log("Generating Indian occupation data using AI...");
  console.log(`Processing ${CATEGORIES.length} categories...`);

  const allOccupations: Occupation[] = [];

  const results = await batchProcess(
    CATEGORIES,
    async (cat) => {
      console.log(`Processing category: ${cat.name} (${cat.occupations.length} occupations)`);
      const data = await generateOccupationData(cat.name, cat.occupations);
      console.log(`  Got ${data.length} occupations for ${cat.name}`);
      return data;
    },
    { concurrency: 3, retries: 3 }
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      allOccupations.push(...result.value);
    } else {
      console.error("Batch item failed:", result.reason);
    }
  }

  console.log(`\nTotal occupations generated: ${allOccupations.length}`);

  const outputPath = path.resolve(
    import.meta.dirname,
    "../../artifacts/api-server/src/data/occupations.json"
  );
  const outputDir = path.dirname(outputPath);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(allOccupations, null, 2));
  console.log(`Data written to: ${outputPath}`);
}

main().catch(console.error);
