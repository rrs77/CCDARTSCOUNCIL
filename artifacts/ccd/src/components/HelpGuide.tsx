import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, HelpCircle, Home, Info, BookOpen, Calendar, Edit3, FolderOpen, Tag, Search, Filter, Download, Plus, Save, Check, Clock, Users, Link2, Layers, MessageSquare, Globe } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContextNew';

interface GuideStep {
  title: string;
  content: React.ReactNode;
  image?: string;
  highlightSelector?: string;
}

export type HelpGuideSection =
  | 'activity'
  | 'lesson'
  | 'unit'
  | 'assign'
  | 'print'
  | 'share'
  | 'facts'
  | 'account'
  | 'forum'
  | 'partners'
  | 'settings'
  | 'halfterms'
  | 'planner'
  | 'slides'
  | 'users';

interface HelpGuideProps {
  isOpen: boolean;
  onClose: () => void;
  initialSection?: HelpGuideSection;
}

export function HelpGuide({ isOpen, onClose, initialSection }: HelpGuideProps) {
  const { settings } = useSettings();
  const productName = settings?.branding?.loginTitle || 'Creative Curriculum Designer';
  const [activeSection, setActiveSection] = useState<HelpGuideSection>(initialSection || 'activity');
  const [currentStep, setCurrentStep] = useState(0);
  const [isHomeView, setIsHomeView] = useState(true);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipArrowPosition, setTooltipArrowPosition] = useState('top');
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Trigger animation and reset to home when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      setIsHomeView(true);
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  // Define guide steps for each section
  const activitySteps: GuideStep[] = [
    {
      title: "Creating a New Activity",
      content: (
        <div className="space-y-3">
          <p>Start by navigating to the <strong>Activity Library</strong> tab in the main navigation.</p>
          <p>Click the <strong>Create Activity</strong> button at the top of the page to open the activity creation form.</p>
          <div className="bg-[#E9E6FF] border-l-4 border-[#4338E8] p-3 rounded">
            <p className="text-sm text-[#1F1B4D]"><strong>Tip:</strong> Activities are the building blocks of your lessons. Create reusable activities that can be combined in different ways across multiple lessons.</p>
          </div>
        </div>
      ),
      image: "/manual/activity-library.png",
      highlightSelector: '[data-tab="activity-library"]'
    },
    {
      title: "Fill in Activity Details",
      content: (
        <div className="space-y-3">
          <p>Provide the essential information for your activity:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Activity Name:</strong> Choose a clear, descriptive name that helps identify the activity quickly</li>
            <li><strong>Curriculum Objectives:</strong> Click to choose objectives from EYFS or custom year group curriculum standards</li>
            <li><strong>Category:</strong> Select from predefined categories (e.g., Warm-up, Singing, Instruments, Movement) or create custom categories in Settings</li>
            <li><strong>Year Groups:</strong> Select multiple year groups this activity is suitable for (checkboxes allow multi-selection)</li>
            <li><strong>Duration:</strong> Set the expected duration in minutes to help with lesson planning</li>
          </ul>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded mt-3">
            <p className="text-sm text-amber-900"><strong>Note:</strong> Selecting curriculum objectives helps track standards coverage across your lessons and units.</p>
          </div>
        </div>
      )
    },
    {
      title: "Add Activity Content",
      content: (
        <div className="space-y-3">
          <p>Use the rich text editor to provide comprehensive content:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Introduction/Context:</strong> Provide background information, learning goals, or teaching notes that set up the activity</li>
            <li><strong>Activity Instructions:</strong> Write detailed step-by-step instructions for delivering the activity in class</li>
            <li><strong>Formatting:</strong> Use the toolbar to add bold text, italic, bullet lists, and numbered lists for clarity</li>
            <li><strong>Print Preview:</strong> A dividing line automatically separates these two sections in PDF exports</li>
          </ul>
          <div className="p-3 rounded mt-3" style={{backgroundColor: '#E6F7F5', borderLeft: '4px solid #0BA596'}}>
            <p className="text-sm" style={{color: '#0BA596'}}><strong>Best Practice:</strong> Include clear instructions so the activity can be easily delivered by you or a colleague.</p>
          </div>
        </div>
      )
    },
    {
      title: "Add Resources & Links",
      content: (
        <div className="space-y-3">
          <p>Enhance your activity with external resources:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Video Links:</strong> YouTube tutorial videos or demonstration clips</li>
            <li><strong>Audio Files:</strong> Music tracks, backing tracks, or sound effects</li>
            <li><strong>Teaching Materials:</strong> PDFs, worksheets, or online resources</li>
            <li><strong>Images:</strong> Visual aids or reference images</li>
          </ul>
          <p className="mt-3">Simply paste the URL and add a descriptive label. Resources will be accessible directly from the activity and any lessons that include it.</p>
        </div>
      )
    },
    {
      title: "Save Your Activity",
      content: (
        <div className="space-y-3">
          <p>Before saving, review all the information to ensure accuracy:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Check that the name is descriptive and unique</li>
            <li>Verify the category, level, and duration are correct</li>
            <li>Ensure instructions are clear and complete</li>
            <li>Confirm all resource links are working</li>
          </ul>
          <p className="mt-3">Click the <strong>Create Activity</strong> button at the bottom of the form.</p>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-3">
            <p className="text-sm text-[#1F1B4D]"><strong>Success!</strong> Your activity now appears in the Activity Library and is ready to be added to lessons. You can edit or delete it anytime from the library.</p>
          </div>
        </div>
      )
    }
  ];

  const lessonSteps: GuideStep[] = [
    {
      title: "Creating a New Lesson",
      content: (
        <div className="space-y-3">
          <p>Navigate to the <strong>Lesson Builder</strong> tab in the main navigation.</p>
          <p>You'll see a blank lesson template with an activity library panel on the right side.</p>
          <div className="bg-[#E9E6FF] border-l-4 border-[#4338E8] p-3 rounded">
            <p className="text-sm text-[#1F1B4D]"><strong>Overview:</strong> Lessons are composed of activities from your library. Build a structured lesson by selecting and arranging activities in a logical flow.</p>
          </div>
        </div>
      ),
      image: "/manual/lesson-builder.png",
      highlightSelector: '[data-tab="lesson-builder"]'
    },
    {
      title: "Set Lesson Details",
      content: (
        <div className="space-y-3">
          <p>Start by filling in the essential lesson information:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Lesson Title:</strong> Give your lesson a descriptive name that indicates the focus or topic</li>
            <li><strong>Week Number:</strong> Assign this lesson to a specific week in your curriculum</li>
            <li><strong>Term:</strong> Select the appropriate term (Autumn, Spring, or Summer)</li>
            <li><strong>Year Group:</strong> Choose which year group(s) this lesson is designed for</li>
          </ul>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded mt-3">
            <p className="text-sm text-amber-900"><strong>Planning Tip:</strong> Week numbers help organize lessons chronologically, making it easier to track curriculum coverage throughout the year.</p>
          </div>
        </div>
      )
    },
    {
      title: "Add Activities to Your Lesson",
      content: (
        <div className="space-y-3">
          <p>Browse and add activities from your library using multiple methods:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Drag & Drop:</strong> Click and drag activities directly into your lesson plan</li>
            <li><strong>Bulk Selection:</strong> Check multiple activities and click "Add Selected" to add them all at once</li>
            <li><strong>Search:</strong> Use the search box to quickly find specific activities by name</li>
            <li><strong>Filter:</strong> Filter by category (e.g., Warm-up, Singing, Games) or year group to narrow your options</li>
          </ul>
          <div className="p-3 rounded mt-3" style={{backgroundColor: '#E6F7F5', borderLeft: '4px solid #0BA596'}}>
            <p className="text-sm" style={{color: '#0BA596'}}><strong>Best Practice:</strong> Build a balanced lesson with a mix of activity types - start with a warm-up, include main activities, and end with a cool-down or reflection.</p>
          </div>
        </div>
      )
    },
    {
      title: "Organise Your Lesson Flow",
      content: (
        <div className="space-y-3">
          <p>Once activities are added, organise them for optimal lesson flow:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Auto-Grouping:</strong> Activities are automatically grouped by category for easy viewing</li>
            <li><strong>Reorder:</strong> Drag activities up or down to change the sequence within your lesson</li>
            <li><strong>Remove:</strong> Hover over an activity and click the trash icon to remove it</li>
            <li><strong>Duration Tracking:</strong> The total lesson duration updates automatically as you add or remove activities</li>
          </ul>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded mt-3">
            <p className="text-sm text-purple-900"><strong>Time Management:</strong> Keep an eye on the total duration to ensure your lesson fits within the allocated time slot.</p>
          </div>
        </div>
      )
    },
    {
      title: "Add Lesson Notes & Objectives",
      content: (
        <div className="space-y-3">
          <p>Use the <strong>Lesson Notes</strong> section at the bottom to document important details:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Learning Objectives:</strong> What students will learn or achieve</li>
            <li><strong>Teaching Tips:</strong> Reminders for effective delivery</li>
            <li><strong>Required Materials:</strong> Equipment, instruments, or resources needed</li>
            <li><strong>Assessment Notes:</strong> How you'll evaluate student progress</li>
            <li><strong>Differentiation:</strong> Adaptations for different ability levels</li>
          </ul>
          <p className="mt-3">Use the rich text editor toolbar to format your notes with bold text, lists, and paragraphs.</p>
        </div>
      )
    },
    {
      title: "Save & Manage Your Lesson",
      content: (
        <div className="space-y-3">
          <p>When your lesson is complete, you have several save options:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Save Plan:</strong> Saves the lesson and keeps it open for further editing</li>
            <li><strong>Save & New:</strong> Saves the lesson and opens a blank template to create another lesson immediately</li>
            <li><strong>Edit Later:</strong> Access saved lessons from the Unit Builder or Calendar views</li>
          </ul>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-3">
            <p className="text-sm text-[#1F1B4D]"><strong>Next Step:</strong> Once saved, your lesson is ready to be added to a unit and scheduled on your calendar. You can also duplicate and modify it for different year groups or terms.</p>
          </div>
        </div>
      )
    }
  ];

  const unitSteps: GuideStep[] = [
    {
      title: "Creating a New Unit of Work",
      content: (
        <div className="space-y-3">
          <p>Navigate to the <strong>Unit Builder</strong> tab in the main navigation.</p>
          <p>Click the <strong>Create New</strong> button to start building a fresh unit of work.</p>
          <div className="bg-[#E9E6FF] border-l-4 border-[#4338E8] p-3 rounded">
            <p className="text-sm text-[#1F1B4D]"><strong>What is a Unit?</strong> A unit is a collection of related lessons organised around a theme or topic, typically covering a half-term (5-7 weeks) of teaching.</p>
          </div>
        </div>
      ),
      image: "/manual/unit-viewer.png",
      highlightSelector: '[data-tab="unit-viewer"]'
    },
    {
      title: "Set Unit Details & Description",
      content: (
        <div className="space-y-3">
          <p>Provide the key information for your unit:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Unit Name:</strong> Choose a clear, thematic name (e.g., "Rhythm & Movement", "World Music Exploration")</li>
            <li><strong>Term:</strong> Select the specific half-term (Autumn 1/2, Spring 1/2, Summer 1/2)</li>
            <li><strong>Year Group:</strong> Specify which year group(s) this unit is designed for</li>
            <li><strong>Unit Description:</strong> Write an overview including learning goals, themes, and key outcomes</li>
          </ul>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded mt-3">
            <p className="text-sm text-amber-900"><strong>Planning Tip:</strong> A well-written description helps you and colleagues understand the unit's purpose and progression at a glance.</p>
          </div>
        </div>
      )
    },
    {
      title: "Browse & Select Lessons",
      content: (
        <div className="space-y-3">
          <p>Find and select lessons from your library using the <strong>Available Lessons</strong> panel:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Click to Select:</strong> Click individual lessons to highlight them (hold Shift or Cmd/Ctrl for multiple selections)</li>
            <li><strong>Search:</strong> Use the search box to find lessons by title or content</li>
            <li><strong>Filter by Term:</strong> Narrow down lessons by the term they were created for</li>
            <li><strong>Filter by Year Group:</strong> Show only lessons for specific year groups</li>
            <li><strong>Select All:</strong> Quickly select all filtered lessons at once</li>
          </ul>
          <p className="mt-3">Once selected, click <strong>Add Selected Lessons</strong> to move them into your unit.</p>
        </div>
      )
    },
    {
      title: "Organise Lesson Sequence",
      content: (
        <div className="space-y-3">
          <p>In the <strong>Unit Contents</strong> panel, arrange your lessons for optimal progression:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Reorder Lessons:</strong> Use the up/down arrow buttons to change the sequence</li>
            <li><strong>Remove Lessons:</strong> Click the trash icon to remove a lesson from the unit</li>
            <li><strong>View Details:</strong> Click on a lesson to see its activities and notes</li>
            <li><strong>Check Duration:</strong> Ensure lessons fit your typical class length</li>
          </ul>
          <div className="p-3 rounded mt-3" style={{backgroundColor: '#E6F7F5', borderLeft: '4px solid #0BA596'}}>
            <p className="text-sm" style={{color: '#0BA596'}}><strong>Sequencing Matters:</strong> Order lessons to build skills progressively, starting with foundational concepts and advancing to more complex activities.</p>
          </div>
        </div>
      )
    },
    {
      title: "Save & Manage Your Unit",
      content: (
        <div className="space-y-3">
          <p>Finalize and save your unit of work:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Review all unit details, lesson sequence, and descriptions</li>
            <li>Click the <strong>Save Unit</strong> button to store your unit</li>
            <li>Your unit appears in the <strong>Your Units</strong> panel on the right</li>
            <li>Edit units anytime by selecting them from the list</li>
            <li>Duplicate units to create variations for different year groups</li>
          </ul>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-3">
            <p className="text-sm text-[#1F1B4D]"><strong>Ready to Schedule:</strong> Your saved unit is now ready to be assigned to specific weeks on your calendar, making it easy to plan your entire academic year.</p>
          </div>
        </div>
      )
    }
  ];

  const assignSteps: GuideStep[] = [
    {
      title: "Understanding the Calendar View",
      content: (
        <div className="space-y-3">
          <p>Navigate to the <strong>Calendar</strong> tab in the main navigation.</p>
          <p>The calendar view shows your entire academic year divided into weeks, with half-term boundaries clearly marked.</p>
          <div className="bg-[#E9E6FF] border-l-4 border-[#4338E8] p-3 rounded">
            <p className="text-sm text-[#1F1B4D]"><strong>Calendar Overview:</strong> This is where your planning comes to life. Assign units to specific dates to create a complete year-long curriculum map.</p>
          </div>
        </div>
      ),
      image: "/manual/calendar.png",
      highlightSelector: '[data-tab="unit-viewer"]'
    },
    {
      title: "Select a Unit to Schedule",
      content: (
        <div className="space-y-3">
          <p>In the <strong>Your Units</strong> panel (usually on the right), locate the unit you want to schedule:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Browse your saved units organised by term</li>
            <li>Check the unit details to confirm it's the right one</li>
            <li>Click the <strong>Calendar</strong> icon next to the unit name</li>
          </ul>
          <p className="mt-3">This opens the "Add Unit to Calendar" scheduling dialog.</p>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded mt-3">
            <p className="text-sm text-amber-900"><strong>Pro Tip:</strong> Review the unit's lesson count and duration before scheduling to ensure it fits your half-term timeline.</p>
          </div>
        </div>
      )
    },
    {
      title: "Choose Start Date & Frequency",
      content: (
        <div className="space-y-3">
          <p>In the scheduling dialog, configure when and how often lessons occur:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Start Date:</strong> Select the date for the first lesson (typically the first week of a half-term)</li>
            <li><strong>Frequency:</strong> Set how often lessons repeat (e.g., weekly, twice per week)</li>
            <li><strong>Days of Week:</strong> Choose which day(s) of the week lessons occur</li>
            <li><strong>Preview:</strong> Review the generated schedule before confirming</li>
          </ul>
          <p className="mt-3">Lessons will be automatically scheduled in sequence, following your unit's lesson order.</p>
        </div>
      )
    },
    {
      title: "Understanding Half-Term Periods",
      content: (
        <div className="space-y-3">
          <p>The system automatically identifies which half-term your scheduled dates fall into:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="bg-orange-50 p-2 rounded border border-orange-200">
              <p className="font-semibold text-orange-900">Autumn 1 (A1)</p>
              <p className="text-sm text-orange-800">September - October</p>
            </div>
            <div className="bg-orange-100 p-2 rounded border border-orange-300">
              <p className="font-semibold text-orange-900">Autumn 2 (A2)</p>
              <p className="text-sm text-orange-800">November - December</p>
            </div>
            <div className="p-2 rounded" style={{backgroundColor: '#E6F7F5', border: '1px solid #B8E6E0'}}>
              <p className="font-semibold" style={{color: '#0BA596'}}>Spring 1 (SP1)</p>
              <p className="text-sm" style={{color: '#0BA596'}}>January - February</p>
            </div>
            <div className="p-2 rounded" style={{backgroundColor: '#D1F2EB', border: '1px solid #0BA596'}}>
              <p className="font-semibold" style={{color: '#0BA596'}}>Spring 2 (SP2)</p>
              <p className="text-sm" style={{color: '#0BA596'}}>March - April</p>
            </div>
            <div className="bg-[#E9E6FF] p-2 rounded border border-[#E2E0EF]">
              <p className="font-semibold text-[#1F1B4D]">Summer 1 (SM1)</p>
              <p className="text-sm text-[#1F1B4D]">April - May</p>
            </div>
            <div className="bg-[#E9E6FF] p-2 rounded border border-[#bcb7f4]">
              <p className="font-semibold text-[#1F1B4D]">Summer 2 (SM2)</p>
              <p className="text-sm text-[#1F1B4D]">June - July</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Confirm & Add to Calendar",
      content: (
        <div className="space-y-3">
          <p>Review the schedule preview and click <strong>Add to Calendar</strong> to confirm:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Each lesson from your unit is created as a scheduled lesson plan</li>
            <li>Lessons appear on the calendar on their assigned dates</li>
            <li>Units are color-coded for easy visual identification</li>
            <li>Hover over calendar entries to see lesson details</li>
          </ul>
          <div className="p-3 rounded mt-3" style={{backgroundColor: '#E6F7F5', borderLeft: '4px solid #0BA596'}}>
            <p className="text-sm" style={{color: '#0BA596'}}><strong>Scheduled!</strong> Your unit is now on the calendar. You can see at a glance what you're teaching each week throughout the term.</p>
          </div>
        </div>
      )
    },
    {
      title: "Managing & Editing Schedule",
      content: (
        <div className="space-y-3">
          <p>Once units are scheduled, you have full control to manage and adjust:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>View Lessons:</strong> Click any date to see scheduled lesson details</li>
            <li><strong>Edit Lessons:</strong> Click on a lesson to modify activities, notes, or content</li>
            <li><strong>Reschedule:</strong> Drag and drop lessons to different dates, or edit the date directly</li>
            <li><strong>Filter View:</strong> Use the unit filter dropdown to view specific units only</li>
            <li><strong>Print/Export:</strong> Generate printable lesson plans or export your schedule</li>
            <li><strong>Delete:</strong> Remove scheduled lessons if plans change</li>
          </ul>
          <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded mt-3">
            <p className="text-sm text-purple-900"><strong>Flexibility:</strong> Your calendar is fully editable. Feel free to adjust as needed - school life rarely goes exactly to plan!</p>
          </div>
        </div>
      )
    }
  ];

  const printSteps: GuideStep[] = [
    {
      title: "Print & Export Overview",
      content: (
        <div className="space-y-3">
          <p>Export your plans as PDFs or print directly from the <strong>Calendar</strong> or <strong>Lesson Library</strong>.</p>
          <div className="bg-[#E9E6FF] border-l-4 border-[#4338E8] p-3 rounded">
            <p className="text-sm text-[#1F1B4D]"><strong>Where to find it:</strong> Use the <strong>Export PDF</strong> button on the Calendar tab to generate a branded PDF of your week or month. Lesson plans can also be printed from the lesson detail view.</p>
          </div>
        </div>
      ),
      image: "/manual/export-print.png",
      highlightSelector: '[data-tab="unit-viewer"]'
    },
    {
      title: "Exporting the Calendar",
      content: (
        <div className="space-y-3">
          <p>From the <strong>Calendar</strong> tab:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Export PDF:</strong> Click the button to generate a PDF of the current view (week or month)</li>
            <li><strong>Branding:</strong> The PDF uses your school name, logo letters, and colours from Settings → School tools → Login & footer</li>
            <li><strong>Lesson links:</strong> Activity and resource links in lesson entries are included as clickable links in the PDF</li>
            <li><strong>Layout:</strong> Choose week or month view before exporting to get the layout you want</li>
          </ul>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded mt-3">
            <p className="text-sm text-amber-900"><strong>Tip:</strong> Set up branding in Settings first so your exported calendars look professional and on-brand.</p>
          </div>
        </div>
      )
    },
    {
      title: "Printing Lesson Plans",
      content: (
        <div className="space-y-3">
          <p>Print individual lesson plans or half-term overviews:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Open a lesson from the Lesson Library or Calendar and use the print option</li>
            <li>From the Unit Designer you can export a half-term or unit plan</li>
            <li>Printed plans include activities, notes, and curriculum objectives</li>
            <li><strong>The Facts:</strong> Use the in-page PDF viewer on /the-facts/ for Print or Save — see the The Facts help topic</li>
            <li><strong>Partner files:</strong> Downloads through CCDesigner appear under Settings → Downloads</li>
          </ul>
        </div>
      )
    }
  ];

  const shareSteps: GuideStep[] = [
    {
      title: "Sharing Plans with a Web Link",
      content: (
        <div className="space-y-3">
          <p>Share any lesson or half-term plan with colleagues or substitutes via a <strong>shareable web link</strong>.</p>
          <div className="bg-[#E9E6FF] border-l-4 border-[#4338E8] p-3 rounded">
            <p className="text-sm text-[#1F1B4D]"><strong>How it works:</strong> In the <strong>Lesson Library</strong>, each lesson card has a <strong>Copy Link</strong> (or link) button. Click it to generate a unique URL that opens a read-only view of that lesson plan.</p>
          </div>
        </div>
      ),
      image: "/manual/share.png"
    },
    {
      title: "Creating & Using Share Links",
      content: (
        <div className="space-y-3">
          <p>Steps to share a plan:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Lesson Library:</strong> Find the lesson, then click the <strong>Copy Link</strong> button on the card (coral/red button)</li>
            <li><strong>Link generated:</strong> The first time you click, a PDF may be generated and the link is copied to your clipboard</li>
            <li><strong>Paste & send:</strong> Paste the link into an email, message, or document; anyone with the link can view the lesson (read-only)</li>
            <li><strong>Reuse:</strong> The same link can be used again; later clicks copy the existing link without regenerating</li>
          </ul>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded mt-3">
            <p className="text-sm text-[#1F1B4D]"><strong>Use cases:</strong> Share with cover teachers, send to colleagues for feedback, or keep a link in your timetable for quick access.</p>
          </div>
        </div>
      )
    },
    {
      title: "Multi-Class & Year Groups",
      content: (
        <div className="space-y-3">
          <p>Manage multiple year groups or classes in one place:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Year group selector:</strong> Use the dropdown in the header to switch between year groups (e.g. Reception, Year 1, Year 2)</li>
            <li><strong>Separate data:</strong> Lessons, units, and calendar are stored per year group so each class has its own plan</li>
            <li><strong>Copy lessons:</strong> Use <strong>Copy Lesson</strong> in the Lesson Library to copy lessons from one year group to another</li>
            <li><strong>Settings:</strong> Add or edit year groups in Settings → My classes</li>
          </ul>
        </div>
      )
    }
  ];

  const factsSteps: GuideStep[] = [
    {
      title: "Open The Facts",
      content: (
        <div className="space-y-3">
          <p>The Facts is the evidence briefing for Creative Curriculum Designer — stages, cold spots, enrichment, and the proposed solution.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>From the login screen, use the <strong>The facts</strong> button</li>
            <li>Or open <strong>/the-facts/</strong> in your browser</li>
          </ul>
          <div className="bg-[#E9E6FF] border-l-4 border-[#4338E8] p-3 rounded">
            <p className="text-sm text-[#1F1B4D]"><strong>What’s new:</strong> The briefing is a magazine-style PDF with a cover, photos, and charts. Index cards drop in one by one, and a jump bar lets you move between stages.</p>
          </div>
        </div>
      )
    },
    {
      title: "Navigate the slides",
      content: (
        <div className="space-y-3">
          <p>Use the stage <strong>Previous / Next</strong> controls and the <strong>jump bar</strong> to move from EYFS through to the Solution. Enrichment sits after Cold spots.</p>
          <p>Copy now states what the programme <strong>will give</strong> and <strong>provides</strong> — not what it “aims to” do.</p>
        </div>
      )
    },
    {
      title: "Print or save the PDF",
      content: (
        <div className="space-y-3">
          <p>Use the top-right <strong>The facts PDF</strong> button to open the in-page viewer.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Print</strong> — send the 17-page briefing to a printer</li>
            <li><strong>Save</strong> — download the PDF</li>
          </ul>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded">
            <p className="text-sm text-amber-900"><strong>Tracking:</strong> Resource use is recorded at teacher level (login + IP). It is not pupil tracking.</p>
          </div>
        </div>
      )
    }
  ];

  const accountSteps: GuideStep[] = [
    {
      title: "Create an account or sign in",
      content: (
        <div className="space-y-3">
          <p>On the login screen you can <strong>Create an account</strong> or sign in with an existing email and password.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Invited users may be asked to <strong>Choose a new password</strong> the first time they sign in</li>
            <li>Use <strong>Remember me</strong> if you want to stay signed in on this device</li>
            <li>If you arrived from Forum or a download, you are returned to that page after sign-in</li>
          </ul>
        </div>
      )
    },
    {
      title: "Roles and user management",
      content: (
        <div className="space-y-3">
          <p>Admins open <strong>Settings → Users</strong> to invite people and set roles.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Teacher / creator</strong> — plan lessons and use the forum</li>
            <li><strong>Organisation</strong> — school or partner organisation account</li>
            <li><strong>Admin / Super admin</strong> — manage users, hub admin, and forum categories</li>
          </ul>
        </div>
      )
    },
    {
      title: "My Downloads and analytics",
      content: (
        <div className="space-y-3">
          <p>Partner and hub resources are downloaded through CCDesigner so use can be recorded.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Settings → Downloads</strong> — your own download history</li>
            <li><strong>Settings → Downloads (analytics chip)</strong> — organisation or global totals (admins)</li>
          </ul>
          <div className="p-3 rounded" style={{backgroundColor: '#E6F7F5', borderLeft: '4px solid #0BA596'}}>
            <p className="text-sm" style={{color: '#0BA596'}}><strong>Note:</strong> You may be asked to sign in before a gated file opens. Your place on the page is remembered.</p>
          </div>
        </div>
      )
    }
  ];

  const forumSteps: GuideStep[] = [
    {
      title: "Open the Community Forum",
      content: (
        <div className="space-y-3">
          <p>Click the <strong>speech-bubble</strong> icon in the header, or go to <strong>/forum</strong>.</p>
          <p>Anyone can browse <strong>published</strong> categories (for example Introductions) without signing in.</p>
        </div>
      )
    },
    {
      title: "Post, reply, and react",
      content: (
        <div className="space-y-3">
          <p>To start a topic or reply, sign in with your CCDesigner account.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Sign in</strong> — opens the main login page, then brings you back here</li>
            <li><strong>Sign in here</strong> — enter email and password in the modal without leaving the forum</li>
          </ul>
          <p>Teachers can create topics and replies. Viewers can read published categories.</p>
        </div>
      )
    },
    {
      title: "Forum admin",
      content: (
        <div className="space-y-3">
          <p>Owners and moderators use <strong>/forum/admin</strong>, the shield icon on the forum header (when signed in), or <strong>/forum/admin</strong>.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Publish or unpublish categories (seeded categories start as drafts)</li>
            <li>Lock a category, review reports, and set notification preferences</li>
          </ul>
          <div className="bg-[#E9E6FF] border-l-4 border-[#4338E8] p-3 rounded">
            <p className="text-sm text-[#1F1B4D]">Safeguarding reports are flagged for moderators.</p>
          </div>
        </div>
      )
    }
  ];

  const partnersSteps: GuideStep[] = [
    {
      title: "Partner hubs",
      content: (
        <div className="space-y-3">
          <p>Open a partner from the dashboard partners area or a short URL such as <strong>/omnimusic</strong>, <strong>/rsc</strong>, <strong>/bristololdvic</strong>, <strong>/kneehigh</strong>, <strong>/jazznorth</strong>, or <strong>/ems</strong>.</p>
          <p><strong>OmniMusic</strong> uses the Resource Zone: the AMT hub link plus free session PDFs. Drama education hubs include <strong>RSC Education</strong>, <strong>Bristol Old Vic</strong>, and <strong>Kneehigh</strong>. Other partners (Jazz North, LSO, ROH, We Teach Drama, and more) have their own resource cards and planner actions. Organisations are listed A–Z with a letter browser on the right.</p>
        </div>
      )
    },
    {
      title: "Music Hubs directory",
      content: (
        <div className="space-y-3">
          <p>The <strong>Music Hubs</strong> directory lists UK hubs. Open a hub page for local resources. Some hubs need a subscriber password to unlock files.</p>
          <p>East of England focuses on Greater Essex: Essex Music Service, Music-on-Sea and Thurrock. On the EMS hub, use the hubs list and district map first. <strong>Resources</strong> (brochure, workshops) open on <em>district / borough</em> pages such as Chelmsford — not on the EMS landing page.</p>
          <p>South West includes <strong>West of England Music Hub</strong> — the combined hub that succeeded Bristol Music Hub, led by Bristol Beacon with WEMA for Bath &amp; North East Somerset, North Somerset and South Gloucestershire.</p>
        </div>
      )
    },
    {
      title: "Hub administration",
      content: (
        <div className="space-y-3">
          <p>Organisation owners and super admins open <strong>Settings → School tools → Partner hubs</strong> to manage members, resources, and the public hub page.</p>
          <p><strong>Royal Ballet and Opera (/roh)</strong> and <strong>RSC Education (/rsc)</strong> each have organisation hubs so editors can update their pages after being granted hub membership (or as super admin).</p>
        </div>
      )
    }
  ];


  const settingsSteps: GuideStep[] = [
    {
      title: 'Open Settings',
      content: (
        <div className="space-y-3">
          <p>Open <strong>Settings</strong> from the gear in the header or your account menu. It is a full page with a left nav — not a modal.</p>
          <div className="rounded-xl border border-[#E2E0EF] bg-[#FAFAFC] p-3">
            <p className="text-[13px] font-medium text-[#5C5878]">Sections: My classes · Activity folders · Learning objectives · Preferences · Downloads · Users · School tools.</p>
          </div>
        </div>
      ),
    },
    {
      title: 'My classes & folders',
      content: (
        <div className="space-y-3">
          <p><strong>My classes</strong> groups classes by key stage (colour accents). Expand a stage to edit classes; subject sub-groups stay collapsed until you open them.</p>
          <p><strong>Activity folders</strong> control which folders each class sees in the Activity Library. Changes save as you go.</p>
        </div>
      ),
    },
    {
      title: 'Preferences',
      content: (
        <div className="space-y-3">
          <p>Set your <strong>school name</strong>, toggle <strong>button tips</strong>, and edit <strong>activity resource labels</strong> as compact tiles (icon, label, Show).</p>
        </div>
      ),
    },
  ];

  const halfTermSteps: GuideStep[] = [
    {
      title: 'Half-term year board',
      content: (
        <div className="space-y-3">
          <p>Open <strong>Half-terms</strong> from the sidebar. The year board shows terms across the year for each class.</p>
          <div className="rounded-xl border border-[#E2E0EF] bg-[#E9E6FF]/50 p-3 text-[13px] font-medium text-[#2A2299]">
            Assign schemes from the Add-scheme picker — key stages sit in a two-column grid and start collapsed.
          </div>
        </div>
      ),
    },
    {
      title: 'Class boards',
      content: (
        <div className="space-y-3">
          <p>Drill into a class board to place schemes into slots for each half-term. Drag or assign from the multi-panel picker.</p>
        </div>
      ),
    },
  ];

  const plannerSteps: GuideStep[] = [
    {
      title: 'Planner outline slots',
      content: (
        <div className="space-y-3">
          <p>The <strong>Planner</strong> lays out weekly teaching for a class. Outline slots hold lessons and activities in teaching order.</p>
          <ul className="list-disc pl-5 space-y-1 text-[14px]">
            <li>Pick a class, then fill slots from your Lesson Library or Activity Library</li>
            <li>Timetable slots live under Planner → Timetable</li>
            <li>Reflections and notes stay with each week</li>
          </ul>
        </div>
      ),
    },
  ];

  const slidesSteps: GuideStep[] = [
    {
      title: 'Interactive slides',
      content: (
        <div className="space-y-3">
          <p>Open <strong>Slides</strong> (Interactive Lesson Viewer) from the sidebar to present classroom slides.</p>
          <ul className="list-disc pl-5 space-y-1 text-[14px]">
            <li>Browse hub and library lessons</li>
            <li>Editors can build slides in the Interactive Lesson Editor</li>
            <li>Present full-screen for the class</li>
          </ul>
        </div>
      ),
    },
  ];

  const usersSteps: GuideStep[] = [
    {
      title: 'Users (admins)',
      content: (
        <div className="space-y-3">
          <p>School leads and admins open <strong>Settings → Users</strong> to invite people, set roles, assign classes, reset passwords, and suspend access.</p>
          <div className="rounded-xl border border-[#E2E0EF] bg-[#FAFAFC] p-3 text-[13px] font-medium text-[#5C5878]">
            Super admins see everyone. Organisation / hub admins only manage people in their own organisation (for example Chelmsford Music Hub).
          </div>
        </div>
      ),
    },
    {
      title: 'Invite & set password',
      content: (
        <div className="space-y-3">
          <p>Use <strong>Invite user</strong> or <strong>Import CSV</strong>. Invitees open the email link and choose a password on <strong>/reset-password</strong>. They can also change password anytime from the account menu.</p>
        </div>
      ),
    },
  ];

  // Get the current steps based on active section
  const getCurrentSteps = () => {
    switch (activeSection) {
      case 'activity':
        return activitySteps;
      case 'lesson':
        return lessonSteps;
      case 'unit':
        return unitSteps;
      case 'assign':
        return assignSteps;
      case 'print':
        return printSteps;
      case 'share':
        return shareSteps;
      case 'facts':
        return factsSteps;
      case 'account':
        return accountSteps;
      case 'forum':
        return forumSteps;
      case 'partners':
        return partnersSteps;
      case 'settings':
        return settingsSteps;
      case 'halfterms':
        return halfTermSteps;
      case 'planner':
        return plannerSteps;
      case 'slides':
        return slidesSteps;
      case 'users':
        return usersSteps;
      default:
        return activitySteps;
    }
  };

  const currentSteps = getCurrentSteps();

  // Handle highlighting elements
  useEffect(() => {
    if (!isOpen) return;

    const steps = getCurrentSteps();
    const currentStepData = steps[currentStep];
    
    // Remove previous highlight
    if (highlightedElement) {
      highlightedElement.classList.remove('highlight-pulse');
      highlightedElement.classList.remove('ring-4');
      highlightedElement.classList.remove('ring-blue-500');
      highlightedElement.classList.remove('ring-opacity-70');
      highlightedElement.classList.remove('z-40');
    }
    
    // Add highlight to new element
    if (currentStepData.highlightSelector) {
      const element = document.querySelector(currentStepData.highlightSelector) as HTMLElement;
      if (element) {
        element.classList.add('highlight-pulse');
        element.classList.add('ring-4');
        element.classList.add('ring-blue-500');
        element.classList.add('ring-opacity-70');
        element.classList.add('z-40');
        setHighlightedElement(element);
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    return () => {
      // Clean up on unmount
      if (highlightedElement) {
        highlightedElement.classList.remove('highlight-pulse');
        highlightedElement.classList.remove('ring-4');
        highlightedElement.classList.remove('ring-blue-500');
        highlightedElement.classList.remove('ring-opacity-70');
        highlightedElement.classList.remove('z-40');
      }
    };
  }, [isOpen, activeSection, currentStep]);

  if (!isOpen) return null;

  const sectionOrder: HelpGuideSection[] = [
    'activity',
    'lesson',
    'unit',
    'assign',
    'halfterms',
    'planner',
    'slides',
    'settings',
    'users',
    'print',
    'share',
    'facts',
    'account',
    'forum',
    'partners',
  ];

  const handleNext = () => {
    if (currentStep < currentSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const idx = sectionOrder.indexOf(activeSection);
      if (idx >= 0 && idx < sectionOrder.length - 1) {
        setActiveSection(sectionOrder[idx + 1]);
        setCurrentStep(0);
      } else {
        onClose();
      }
    }
  };

  const getStepsForSection = (section: HelpGuideSection) => {
    switch (section) {
      case 'activity': return activitySteps;
      case 'lesson': return lessonSteps;
      case 'unit': return unitSteps;
      case 'assign': return assignSteps;
      case 'print': return printSteps;
      case 'share': return shareSteps;
      case 'facts': return factsSteps;
      case 'account': return accountSteps;
      case 'forum': return forumSteps;
      case 'partners': return partnersSteps;
      case 'settings': return settingsSteps;
      case 'halfterms': return halfTermSteps;
      case 'planner': return plannerSteps;
      case 'slides': return slidesSteps;
      case 'users': return usersSteps;
      default: return activitySteps;
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      const idx = sectionOrder.indexOf(activeSection);
      if (idx > 0) {
        const prevSection = sectionOrder[idx - 1];
        const prevSteps = getStepsForSection(prevSection);
        setActiveSection(prevSection);
        setCurrentStep(prevSteps.length - 1);
      }
    }
  };

  const getSectionIcon = (section: HelpGuideSection) => {
    switch (section) {
      case 'activity':
        return <Tag className="h-5 w-5" />;
      case 'lesson':
        return <Edit3 className="h-5 w-5" />;
      case 'unit':
        return <FolderOpen className="h-5 w-5" />;
      case 'assign':
        return <Calendar className="h-5 w-5" />;
      case 'print':
        return <Download className="h-5 w-5" />;
      case 'share':
        return <Link2 className="h-5 w-5" />;
      case 'facts':
        return <BookOpen className="h-5 w-5" />;
      case 'account':
        return <Users className="h-5 w-5" />;
      case 'forum':
        return <MessageSquare className="h-5 w-5" />;
      case 'partners':
        return <Globe className="h-5 w-5" />;
      case 'settings':
        return <Layers className="h-5 w-5" />;
      case 'halfterms':
        return <Calendar className="h-5 w-5" />;
      case 'planner':
        return <Clock className="h-5 w-5" />;
      case 'slides':
        return <Layers className="h-5 w-5" />;
      case 'users':
        return <Users className="h-5 w-5" />;
      default:
        return <Tag className="h-5 w-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <style>{`
        .modal-bounce {
          animation: modalBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes modalBounce {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          50% {
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
      
      <div className={`bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ${
        isAnimating ? 'modal-bounce' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#1F1B4D] to-[#4338E8] text-white">
          <div className="flex items-center space-x-3">
            <HelpCircle className="h-6 w-6" />
            <h2 className="text-xl font-bold">{productName}</h2>
            {!isHomeView && (
              <button
                onClick={() => setIsHomeView(true)}
                className="ml-2 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center space-x-1.5"
                title="Back to overview"
              >
                <Home className="h-5 w-5" />
                <span className="text-sm font-medium">Home</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Home: Overview (intro + index) – only on home */}
        {isHomeView && (
          <div className="flex-1 overflow-y-auto bg-gradient-to-r from-[#E9E6FF] to-blue-50 border-b border-gray-200">
            <div className="p-6 max-w-4xl mx-auto">
              <p className="text-[15px] font-medium leading-relaxed text-[#1F1B4D] mb-1">
                Studio Score help
              </p>
              <p className="text-[13px] font-medium text-[#5C5878] leading-relaxed mb-5">
                Build activities, lessons and half-term plans; present slides; manage classes and users. Pick a topic:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'activity' as HelpGuideSection, title: 'Activity Library', blurb: 'Folders, hierarchy and creating activities', accent: '#4338E8', tint: '#E9E6FF' },
                  { id: 'lesson' as HelpGuideSection, title: 'Lesson Builder', blurb: 'Assemble activities into lessons', accent: '#4338E8', tint: '#E9E6FF' },
                  { id: 'halfterms' as HelpGuideSection, title: 'Half-terms', blurb: 'Year board and scheme assignment', accent: '#0D9488', tint: '#E6F7F4' },
                  { id: 'planner' as HelpGuideSection, title: 'Planner', blurb: 'Weekly outline slots and timetable', accent: '#D97706', tint: '#FFF4E5' },
                  { id: 'slides' as HelpGuideSection, title: 'Slides', blurb: 'Interactive classroom presentations', accent: '#7C3AED', tint: '#F1E9FF' },
                  { id: 'settings' as HelpGuideSection, title: 'Settings', blurb: 'Classes, folders, preferences', accent: '#2A2299', tint: '#E9E6FF' },
                  { id: 'users' as HelpGuideSection, title: 'Users', blurb: 'Invite, roles and passwords', accent: '#DB2777', tint: '#FCE7F3' },
                  { id: 'partners' as HelpGuideSection, title: 'Partner Hubs', blurb: 'Hub pages and resources', accent: '#DC2626', tint: '#FEECEC' },
                  { id: 'account' as HelpGuideSection, title: 'Account', blurb: 'Sign-in, password and downloads', accent: '#6B7280', tint: '#F3F4F6' },
                  { id: 'unit' as HelpGuideSection, title: 'Units & stacks', blurb: 'Group lessons into units', accent: '#4338E8', tint: '#E9E6FF' },
                  { id: 'forum' as HelpGuideSection, title: 'Forum', blurb: 'Community topics and replies', accent: '#0D9488', tint: '#E6F7F4' },
                  { id: 'facts' as HelpGuideSection, title: 'The Facts', blurb: 'Evidence briefing PDF', accent: '#059669', tint: '#ECFDF5' },
                ].map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => { setActiveSection(card.id); setCurrentStep(0); setIsHomeView(false); }}
                    className="rounded-2xl border border-[#E2E0EF] bg-white p-3.5 text-left shadow-[0_1px_0_rgba(31,27,77,0.04)] transition hover:border-[#bcb7f4] hover:shadow-md"
                    style={{ borderLeftWidth: 4, borderLeftColor: card.accent }}
                  >
                    <div className="mb-2 inline-flex rounded-lg px-2 py-1 text-[11px] font-extrabold" style={{ background: card.tint, color: card.accent }}>
                      Guide
                    </div>
                    <h4 className="text-[14px] font-extrabold tracking-tight text-[#1F1B4D]">{card.title}</h4>
                    <p className="mt-1 text-[12px] font-medium leading-snug text-[#5C5878]">{card.blurb}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 bg-white/60 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  window.dispatchEvent(new Event('ccd:start-walkthrough'));
                }}
                className="px-4 py-2 text-[#4338E8] hover:bg-[#E9E6FF] font-medium rounded-lg transition-colors duration-200"
              >
                Take a quick tour
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-[#4338E8] hover:bg-[#3529d1] text-white font-medium rounded-lg transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Section view: tabs + content + footer – only when not on home */}
        {!isHomeView && (
          <>
        {/* Section Tabs */}
        <div className="flex flex-wrap gap-x-0.5 border-b border-[#E2E0EF] bg-[#FAFAFC] px-1">
          {sectionOrder.map((sectionId) => {
            const labels: Partial<Record<HelpGuideSection, string>> = {
              activity: 'Activities',
              lesson: 'Lessons',
              unit: 'Units',
              assign: 'Calendar',
              halfterms: 'Half-terms',
              planner: 'Planner',
              slides: 'Slides',
              settings: 'Settings',
              users: 'Users',
              print: 'Print',
              share: 'Share',
              facts: 'Facts',
              account: 'Account',
              forum: 'Forum',
              partners: 'Hubs',
            };
            const active = activeSection === sectionId;
            return (
              <button
                key={sectionId}
                type="button"
                onClick={() => { setActiveSection(sectionId); setCurrentStep(0); }}
                className={`flex items-center gap-1.5 px-2.5 py-2.5 text-[12px] font-bold transition-colors ${
                  active
                    ? 'border-b-2 border-[#4338E8] bg-white text-[#4338E8]'
                    : 'text-[#5C5878] hover:text-[#1F1B4D]'
                }`}
              >
                <span className="flex-shrink-0">{getSectionIcon(sectionId)}</span>
                <span className="whitespace-nowrap">{labels[sectionId] || sectionId}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {/* Section Title */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-full">
                {getSectionIcon(activeSection)}
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {activeSection === 'activity' && 'Creating Activities'}
                {activeSection === 'lesson' && 'Building Lessons'}
                {activeSection === 'unit' && 'Units & Stacks'}
                {activeSection === 'assign' && 'Calendar & Half-Terms'}
                {activeSection === 'print' && 'Print & Export'}
                {activeSection === 'share' && 'Share Plans & Multi-Class'}
                {activeSection === 'facts' && 'The Facts briefing'}
                {activeSection === 'account' && 'Accounts & Downloads'}
                {activeSection === 'forum' && 'Community Forum'}
                {activeSection === 'partners' && 'Partners & Hubs'}
              </h3>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                {currentSteps[currentStep].title}
              </h4>
              <div className="prose max-w-none">
                {currentSteps[currentStep].content}
              </div>
              
              {/* Step Image (if available) — hide on load failure to avoid broken-image icons. */}
              {currentSteps[currentStep].image && (
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={currentSteps[currentStep].image}
                    alt={currentSteps[currentStep].title}
                    className="w-full object-cover"
                    onError={(e) => {
                      const wrapper = e.currentTarget.parentElement;
                      if (wrapper) wrapper.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center space-x-2 mb-6">
              {currentSteps.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                    index === currentStep ? 'bg-[#4338E8]' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handlePrevious}
            className={`px-4 py-2 font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
              (currentStep > 0 || activeSection !== 'activity')
                ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                : 'text-gray-400 cursor-not-allowed'
            }`}
            disabled={currentStep === 0 && activeSection === 'activity'}
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Previous</span>
          </button>
          
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {currentSteps.length}
          </div>
          
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-[#4338E8] hover:bg-[#3529d1] text-white font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <span>{currentStep < currentSteps.length - 1 || activeSection !== 'partners' ? 'Next' : 'Finish'}</span>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}