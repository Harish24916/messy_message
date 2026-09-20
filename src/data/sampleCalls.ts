import { SalesCallAnalysis } from '../types';

export const SAMPLE_CALLS: SalesCallAnalysis[] = [
  {
    id: 'call-saas-cloud-01',
    title: 'Enterprise Cloud Intelligence Demo & Pricing Review',
    prospectCompany: 'Nexus Logistics Global',
    dealSize: '$84,000 ARR',
    callDate: 'Today, 10:30 AM',
    durationSeconds: 312, // 5m 12s
    transcript: [
      {
        id: 't-1',
        speaker: 'Speaker A',
        speakerLabel: 'Jordan (Sales Rep - Account Executive)',
        role: 'rep',
        timestamp: '00:06',
        timeInSeconds: 6,
        text: 'Hi Marcus, thank you for making the time today. I saw the recent announcement regarding Nexus Logistics expanding into 4 new fulfillment hubs in Europe—congrats on that scale!',
        sentiment: 'positive',
        engagementScore: 78,
        intentTag: 'Rapport'
      },
      {
        id: 't-2',
        speaker: 'Speaker B',
        speakerLabel: 'Marcus (Prospect - VP of Supply Chain Tech)',
        role: 'prospect',
        timestamp: '00:22',
        timeInSeconds: 22,
        text: 'Thanks Jordan, appreciate you noting that. Honestly, with that expansion our dispatch latency has spiked 32%, and our legacy tracking system is buckling under the volume.',
        sentiment: 'neutral',
        engagementScore: 82,
        intentTag: 'Pain Point'
      },
      {
        id: 't-3',
        speaker: 'Speaker A',
        speakerLabel: 'Jordan (Sales Rep - Account Executive)',
        role: 'rep',
        timestamp: '00:44',
        timeInSeconds: 44,
        text: 'That dispatch latency is exactly what we saw with FreightFlow before they unified on our platform. When you say the legacy system is buckling, what does that mean in terms of daily driver delays or customer escalation costs?',
        sentiment: 'positive',
        engagementScore: 88,
        intentTag: 'Discovery'
      },
      {
        id: 't-4',
        speaker: 'Speaker B',
        speakerLabel: 'Marcus (Prospect - VP of Supply Chain Tech)',
        role: 'prospect',
        timestamp: '01:05',
        timeInSeconds: 65,
        text: 'We are shedding roughly 18 hours a day across operations just rerouting stuck delivery trucks. In Q4 alone, missed SLAs cost us over $140,000 in contractual penalty rebates.',
        sentiment: 'negative',
        engagementScore: 92,
        intentTag: 'Pain Point'
      },
      {
        id: 't-5',
        speaker: 'Speaker A',
        speakerLabel: 'Jordan (Sales Rep - Account Executive)',
        role: 'rep',
        timestamp: '01:32',
        timeInSeconds: 92,
        text: 'Understood. Let me show you how our real-time telemetry pipeline automatically recalculates route contingencies within 400 milliseconds. Here is the live telemetry view from our dashboard.',
        sentiment: 'positive',
        engagementScore: 85,
        intentTag: 'Value Prop'
      },
      {
        id: 't-6',
        speaker: 'Speaker B',
        speakerLabel: 'Marcus (Prospect - VP of Supply Chain Tech)',
        role: 'prospect',
        timestamp: '02:05',
        timeInSeconds: 125,
        text: 'The UI looks snappy, but frankly, our engineering lead is deeply skeptical about the migration effort. We cannot afford a 3-month shutdown while your team ingests our legacy Kafka streams.',
        sentiment: 'negative',
        engagementScore: 68,
        intentTag: 'Objection'
      },
      {
        id: 't-7',
        speaker: 'Speaker A',
        speakerLabel: 'Jordan (Sales Rep - Account Executive)',
        role: 'rep',
        timestamp: '02:30',
        timeInSeconds: 150,
        text: 'That is a completely valid concern, Marcus. You do not need any downtime or Kafka rewrite. We run a dual-write shadow connector that mirrors data in parallel, zero cutover risk. We migrated DHL Global Forwarding in just 9 calendar days.',
        sentiment: 'positive',
        engagementScore: 91,
        intentTag: 'Value Prop'
      },
      {
        id: 't-8',
        speaker: 'Speaker B',
        speakerLabel: 'Marcus (Prospect - VP of Supply Chain Tech)',
        role: 'prospect',
        timestamp: '03:10',
        timeInSeconds: 190,
        text: 'Nine days? That is significantly faster than I anticipated. Okay, what about commercial pricing? Our remaining IT operational budget for this fiscal half is capped.',
        sentiment: 'neutral',
        engagementScore: 80,
        intentTag: 'Pricing'
      },
      {
        id: 't-9',
        speaker: 'Speaker A',
        speakerLabel: 'Jordan (Sales Rep - Account Executive)',
        role: 'rep',
        timestamp: '03:35',
        timeInSeconds: 215,
        text: 'Our enterprise tier is $84,000 annually. When you calculate recovering $140,000 every quarter from eliminated SLA fines, the net ROI pays for itself within the first 60 days.',
        sentiment: 'positive',
        engagementScore: 86,
        intentTag: 'Pricing'
      },
      {
        id: 't-10',
        speaker: 'Speaker B',
        speakerLabel: 'Marcus (Prospect - VP of Supply Chain Tech)',
        role: 'prospect',
        timestamp: '04:15',
        timeInSeconds: 255,
        text: 'The math does make sense if the migration is truly that frictionless. Can you send over the technical architecture spec for my VP of Infrastructure to review this Thursday?',
        sentiment: 'positive',
        engagementScore: 94,
        intentTag: 'Closing'
      },
      {
        id: 't-11',
        speaker: 'Speaker A',
        speakerLabel: 'Jordan (Sales Rep - Account Executive)',
        role: 'rep',
        timestamp: '04:40',
        timeInSeconds: 280,
        text: 'I will send the architecture whitepaper and security packet within the hour. Let us schedule a 20-minute alignment call with your VP of Infrastructure this Thursday at 2 PM. Does that time work for your calendar?',
        sentiment: 'positive',
        engagementScore: 96,
        intentTag: 'Closing'
      },
      {
        id: 't-12',
        speaker: 'Speaker B',
        speakerLabel: 'Marcus (Prospect - VP of Supply Chain Tech)',
        role: 'prospect',
        timestamp: '05:02',
        timeInSeconds: 302,
        text: 'Thursday at 2 PM works. Send the calendar invite and I will see you then.',
        sentiment: 'positive',
        engagementScore: 95,
        intentTag: 'Closing'
      }
    ],
    sentimentTimeline: [
      {
        timeLabel: '00:00',
        timeInSeconds: 0,
        repEngagement: 75,
        prospectEngagement: 60,
        overallSentiment: 15,
        speaker: 'rep',
        event: 'Call Start & Rapport'
      },
      {
        timeLabel: '00:30',
        timeInSeconds: 30,
        repEngagement: 80,
        prospectEngagement: 85,
        overallSentiment: 30,
        speaker: 'prospect',
        event: 'Prospect reveals 32% latency spike',
        transcriptSnippet: 'dispatch latency has spiked 32%, and our legacy tracking system is buckling'
      },
      {
        timeLabel: '01:10',
        timeInSeconds: 70,
        repEngagement: 88,
        prospectEngagement: 92,
        overallSentiment: 10,
        speaker: 'prospect',
        event: 'Pain Point: $140k quarterly penalty rebates',
        transcriptSnippet: 'missed SLAs cost us over $140,000 in contractual penalty rebates'
      },
      {
        timeLabel: '02:00',
        timeInSeconds: 120,
        repEngagement: 72,
        prospectEngagement: 52,
        overallSentiment: -25,
        speaker: 'prospect',
        event: 'Migration Risk Objection: Engineering skepticism',
        transcriptSnippet: 'our engineering lead is deeply skeptical about the migration effort'
      },
      {
        timeLabel: '02:45',
        timeInSeconds: 165,
        repEngagement: 92,
        prospectEngagement: 84,
        overallSentiment: 45,
        speaker: 'rep',
        event: 'Objection Defused: Dual-write shadow connector case study',
        transcriptSnippet: 'We migrated DHL Global Forwarding in just 9 calendar days'
      },
      {
        timeLabel: '03:40',
        timeInSeconds: 220,
        repEngagement: 86,
        prospectEngagement: 78,
        overallSentiment: 55,
        speaker: 'rep',
        event: 'Value-Anchored Pricing ($84k vs $140k cost of inaction)',
        transcriptSnippet: 'ROI pays for itself within the first 60 days'
      },
      {
        timeLabel: '04:30',
        timeInSeconds: 270,
        repEngagement: 94,
        prospectEngagement: 93,
        overallSentiment: 75,
        speaker: 'prospect',
        event: 'Prospect requests technical architecture validation',
        transcriptSnippet: 'Can you send over the technical architecture spec for my VP of Infrastructure?'
      },
      {
        timeLabel: '05:12',
        timeInSeconds: 312,
        repEngagement: 96,
        prospectEngagement: 95,
        overallSentiment: 88,
        speaker: 'both',
        event: 'Firm Next Step Locked: Thursday 2 PM with VP of Infra',
        transcriptSnippet: 'Thursday at 2 PM works. Send the calendar invite'
      }
    ],
    coachingCard: {
      overallScore: 89,
      talkListenRatio: {
        repPercent: 46,
        prospectPercent: 54,
        status: 'Optimal'
      },
      pacingWpm: {
        repWpm: 138,
        prospectWpm: 142
      },
      objectionHandlingScore: 92,
      discoveryQualityScore: 94,
      summary: 'Excellent enterprise discovery call. Jordan executed high-impact economic qualification by digging into operational dollar losses, handled a critical migration objection with verified social proof (DHL case study), and locked down a concrete next step with key decision makers.',
      thingsDoneWell: [
        {
          id: 'well-1',
          title: 'Deep Dollar-Quantified Pain Discovery',
          category: 'Economic Qualification',
          quote: '"When you say the legacy system is buckling, what does that mean in terms of daily driver delays or customer escalation costs?"',
          timestamp: '00:44',
          timeInSeconds: 44,
          analysis: 'Jordan did not stop at surface-level technical pain ("dispatch latency"). By asking for the downstream cost in driver hours and customer rebates, he unlocked the crucial $140k/quarter figure that anchored the whole deal justification.'
        },
        {
          id: 'well-2',
          title: 'Surgical Objection Reframing with Concrete Social Proof',
          category: 'Objection Handling',
          quote: '"You do not need any downtime or Kafka rewrite. We run a dual-write shadow connector... We migrated DHL in just 9 days."',
          timestamp: '02:30',
          timeInSeconds: 150,
          analysis: 'Acknowledged the prospect\'s fear immediately without becoming defensive. Contrasted the prospect\'s fear of a 3-month shutdown against concrete, reputable customer evidence (9-day turnaround).'
        },
        {
          id: 'well-3',
          title: 'Definite Next-Step Closing with Stakeholder Expansion',
          category: 'Closing Urgency',
          quote: '"Let us schedule a 20-minute alignment call with your VP of Infrastructure this Thursday at 2 PM."',
          timestamp: '04:40',
          timeInSeconds: 280,
          analysis: 'Instead of accepting a passive "send me materials" brush-off, Jordan immediately tied the requested architecture whitepaper to a specific calendar invite bringing the ultimate technical blocker (VP of Infra) to the table.'
        }
      ],
      missedOpportunities: [
        {
          id: 'miss-1',
          title: 'Did Not Probe the Full Decision-Making Committee',
          category: 'Stakeholder Mapping',
          quote: '"Can you send over the technical architecture spec for my VP of Infrastructure to review?"',
          timestamp: '04:15',
          timeInSeconds: 255,
          analysis: 'While securing the VP of Infra is great, Jordan missed asking: "Beyond your VP of Infrastructure, will Procurement or the CFO need to review this for Q2 budget release?"',
          actionableTip: 'Always qualify the financial signing authority before scheduling technical deep-dives to prevent surprise procurement stalls.'
        },
        {
          id: 'miss-2',
          title: 'Premature Solution Pitching Before Exploring Alternatives',
          category: 'Discovery Rigor',
          quote: '"Let me show you how our real-time telemetry pipeline automatically recalculates route contingencies..."',
          timestamp: '01:32',
          timeInSeconds: 92,
          analysis: 'Jordan jumped to demoing features right after hearing the $140k metric without asking: "What other solutions or in-house fixes have you already evaluated to solve this?"',
          actionableTip: 'Pause after uncovering big numbers to check competitor mindshare: "Have you explored building this internally or looking at vendor X?"'
        },
        {
          id: 'miss-3',
          title: 'Missed Opportunity to Anchor Higher-Tier Multi-Year Discount',
          category: 'Pricing Strategy',
          quote: '"Our enterprise tier is $84,000 annually. When you calculate recovering $140,000 every quarter..."',
          timestamp: '03:35',
          timeInSeconds: 215,
          analysis: 'Because the customer\'s pain was $560k/year ($140k x 4), $84k was an easy swallow. Jordan could have introduced a 2-year enterprise lock-in with premier support SLAs for $150k total.',
          actionableTip: 'When customer ROI exceeds 5x annual license cost, present a multi-year or enterprise package first before quoting baseline.'
        }
      ],
      recommendedActionItems: [
        'Send architecture spec + security packet along with custom summary of the $140k quarterly savings calculation.',
        'Research Nexus Logistics VP of Infrastructure on LinkedIn and prepare technical comparison benchmarks against Kafka shadow sync.',
        'Draft multi-year agreement options ready for next week\'s proposal phase.'
      ]
    }
  },
  {
    id: 'call-fintech-closing-02',
    title: 'Fintech Automated Compliance Demo & Contract Negotiation',
    prospectCompany: 'Apex Capital Partners',
    dealSize: '$120,000 ARR',
    callDate: 'Yesterday, 3:15 PM',
    durationSeconds: 280,
    transcript: [
      {
        id: 'fc-1',
        speaker: 'Speaker A',
        speakerLabel: 'Jordan (Sales Rep)',
        role: 'rep',
        timestamp: '00:10',
        timeInSeconds: 10,
        text: 'Elena, great catching up again. Following our technical sandbox test last week, I wanted to review your team\'s audit findings and finalize the rollout timeline.',
        sentiment: 'positive',
        engagementScore: 80,
        intentTag: 'Rapport'
      },
      {
        id: 'fc-2',
        speaker: 'Speaker B',
        speakerLabel: 'Elena (Prospect - Chief Compliance Officer)',
        role: 'prospect',
        timestamp: '00:25',
        timeInSeconds: 25,
        text: 'The sandbox passed SOC2 checks cleanly, Jordan. But our CFO reviewed the $120k proposal and pushed back hard. He feels our current manual audit team can manage for another 6 months.',
        sentiment: 'negative',
        engagementScore: 65,
        intentTag: 'Objection'
      },
      {
        id: 'fc-3',
        speaker: 'Speaker A',
        speakerLabel: 'Jordan (Sales Rep)',
        role: 'rep',
        timestamp: '00:50',
        timeInSeconds: 50,
        text: 'I understand why CFOs scrutinize upfront capital right now. Elena, when SEC Rule 10D-1 goes into regulatory effect in 90 days, how many manual audit hours will your team need per trade?',
        sentiment: 'neutral',
        engagementScore: 86,
        intentTag: 'Discovery'
      },
      {
        id: 'fc-4',
        speaker: 'Speaker B',
        speakerLabel: 'Elena (Prospect - Chief Compliance Officer)',
        role: 'prospect',
        timestamp: '01:15',
        timeInSeconds: 75,
        text: 'It would require hiring at least three senior forensic analysts at $160,000 salary each, not including recruiting overhead. And if we get audited and miss the 4-day disclosure window, penalties start at $500,000.',
        sentiment: 'neutral',
        engagementScore: 92,
        intentTag: 'Pain Point'
      },
      {
        id: 'fc-5',
        speaker: 'Speaker A',
        speakerLabel: 'Jordan (Sales Rep)',
        role: 'rep',
        timestamp: '01:45',
        timeInSeconds: 105,
        text: 'So the alternative to the $120k software license isn\'t zero dollars—it\'s over $480,000 in headcount plus uncapped regulatory exposure. What if we put this 1-page financial impact comparison directly in front of your CFO?',
        sentiment: 'positive',
        engagementScore: 94,
        intentTag: 'Value Prop'
      },
      {
        id: 'fc-6',
        speaker: 'Speaker B',
        speakerLabel: 'Elena (Prospect - Chief Compliance Officer)',
        role: 'prospect',
        timestamp: '02:15',
        timeInSeconds: 135,
        text: 'If you can format that comparison with SEC reference footnotes, I will personally walk it into our CFO\'s briefing on Monday morning.',
        sentiment: 'positive',
        engagementScore: 95,
        intentTag: 'Closing'
      }
    ],
    sentimentTimeline: [
      {
        timeLabel: '00:00',
        timeInSeconds: 0,
        repEngagement: 80,
        prospectEngagement: 70,
        overallSentiment: 10,
        speaker: 'rep',
        event: 'Reviewing sandbox test results'
      },
      {
        timeLabel: '00:30',
        timeInSeconds: 30,
        repEngagement: 75,
        prospectEngagement: 55,
        overallSentiment: -35,
        speaker: 'prospect',
        event: 'Budget Objection: CFO pushback on $120k',
        transcriptSnippet: 'our CFO reviewed the $120k proposal and pushed back hard'
      },
      {
        timeLabel: '01:20',
        timeInSeconds: 80,
        repEngagement: 92,
        prospectEngagement: 91,
        overallSentiment: 40,
        speaker: 'prospect',
        event: 'Pain Point Exposed: SEC Rule 10D-1 requires $480k in hires',
        transcriptSnippet: 'three senior forensic analysts at $160,000 salary each'
      },
      {
        timeLabel: '02:20',
        timeInSeconds: 140,
        repEngagement: 96,
        prospectEngagement: 95,
        overallSentiment: 85,
        speaker: 'both',
        event: 'Champion Secured: CCO agrees to present 1-page ROI to CFO',
        transcriptSnippet: 'I will personally walk it into our CFO\'s briefing on Monday morning'
      }
    ],
    coachingCard: {
      overallScore: 91,
      talkListenRatio: {
        repPercent: 44,
        prospectPercent: 56,
        status: 'Optimal'
      },
      pacingWpm: {
        repWpm: 134,
        prospectWpm: 138
      },
      objectionHandlingScore: 96,
      discoveryQualityScore: 92,
      summary: 'Masterclass in cost-of-inaction reframing. Jordan turned a direct pricing pushback into a clear champion commitment by uncovering regulatory hiring costs that were 4x the software price.',
      thingsDoneWell: [
        {
          id: 'fc-w1',
          title: 'External Deadline Catalyzation (SEC Rule 10D-1)',
          category: 'Urgency Creation',
          quote: '"When SEC Rule 10D-1 goes into regulatory effect in 90 days, how many manual audit hours will your team need?"',
          timestamp: '00:50',
          timeInSeconds: 50,
          analysis: 'Used an immovable external compliance deadline to dismantle the CFO\'s proposal to "wait 6 months".'
        },
        {
          id: 'fc-w2',
          title: 'Framing Real Alternative Cost ($480k vs $120k)',
          category: 'Financial Reframe',
          quote: '"So the alternative to the $120k software license isn\'t zero dollars—it\'s over $480,000 in headcount..."',
          timestamp: '01:45',
          timeInSeconds: 105,
          analysis: 'Helped the prospect realize doing nothing costs 4x more than buying the solution.'
        },
        {
          id: 'fc-w3',
          title: 'Arming Champion with CFO-Ready Deliverable',
          category: 'Sales Enablement',
          quote: '"What if we put this 1-page financial impact comparison directly in front of your CFO?"',
          timestamp: '01:45',
          timeInSeconds: 105,
          analysis: 'Transformed Elena into an active internal champion willing to sell on the rep\'s behalf.'
        }
      ],
      missedOpportunities: [
        {
          id: 'fc-m1',
          title: 'Did Not Offer to Join the CFO Meeting Directly',
          category: 'Access to Power',
          quote: '"I will personally walk it into our CFO\'s briefing on Monday morning."',
          timestamp: '02:15',
          timeInSeconds: 135,
          analysis: 'Jordan let the champion carry the proposal alone instead of offering: "Would it help if I joined for 10 minutes to field any tough technical architecture questions?"',
          actionableTip: 'Always attempt to gain direct access to economic buyers rather than relying 100% on internal champions.'
        },
        {
          id: 'fc-m2',
          title: 'Omitted Mention of Implementation Lead Times',
          category: 'Timeline Reality Check',
          quote: '"SEC Rule 10D-1 goes into regulatory effect in 90 days..."',
          timestamp: '00:50',
          timeInSeconds: 50,
          analysis: 'If the regulation hits in 90 days, and implementation takes 30 days, contracts must be signed in 60 days. Jordan did not highlight this buffer urgency.',
          actionableTip: 'Reverse-engineer the sign-by date: "To hit the 90-day SEC cutoff with our 3-week onboarding, we need contract signatures by Day 60."'
        },
        {
          id: 'fc-m3',
          title: 'Did Not Probe Competitive Security Audits',
          category: 'Competitive Defense',
          quote: '"The sandbox passed SOC2 checks cleanly, Jordan."',
          timestamp: '00:25',
          timeInSeconds: 25,
          analysis: 'Jordan did not ask if any competitors were tested in parallel during the sandbox phase.',
          actionableTip: 'Confirm exclusivity: "Did Apex test any other vendor sandboxes during this evaluation period?"'
        }
      ],
      recommendedActionItems: [
        'Build the 1-page executive memo citing SEC Rule 10D-1 and 3x analyst salary costs ($480k).',
        'Offer Elena a 15-minute prep session Sunday evening before her Monday CFO meeting.'
      ]
    }
  }
];
