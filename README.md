# Campus Life Planner

Campus life planners is an application designed to help students organize assignments, study sessions, projects, and other academic activities.

1. Key Features

* Add, edit and delete activities.
* Search, sort, and view activities.
* Dashboard statistics.
* View upcoming activities, total time allocated, most -used tag and their trends.
* Organize activities using tags, such as assignment, study, project, and personal.
* Import and export activities as JSON files for backup and restoration.
* Record activity durations and monitor progress against a duration target.
* Save activities locally using browser localStorage.
* Back up activities to a JSON file and restore them when needed.
* Access the application on mobile phones, tablets, and desktop computers.
* Support keyboard navigation, accessible forms, visible focus indicators, and screen-reader feedback.

2. Setup and Usage

A modern web browser, such as Google Chrome, Firefox, Safari, or Microsoft Edge.
Git (optional, for cloning the repository).
A code editor such as Visual Studio Code (optional, for development).

# Installation:

Step 1: Clone the repository
Step 2: Navigate to the project directory
Step 3: Run the application
No package installation or backend server is required.

3. How to Use

* Open the application and navigate to the Dashboard.
* Select Add Activity to create a new record.
* Enter the activity title, due date, duration, and tag.
* Save the activity to display it in the records section.
* Use the search and sorting controls to find and organize activities.
* Select an existing activity to edit or delete it.
* Review dashboard statistics to monitor activity totals and time allocation.
* Use Settings to adjust duration preferences and targets.
* Export activities as JSON for backup or import a valid JSON file to restore data.

4. Data Model

Example Activity

{
  "id": "activity-001",
  "title": "Complete JavaScript Assignment",
  "dueDate": "2026-10-25",
  "duration": 120,
  "tag": "Assignment",
  "createdAt": "2026-10-18T10:00:00.000Z",
  "updatedAt": "2026-10-18T10:00:00.000Z"
}

Activity records are stored in browser localStorage and can be exported or imported as JSON. 

5. Regex Validation Catalog

Regular expressions (regex) are used to validate user inputs and support activity searching.'

* Checks activity titles and spacing
* Checks numeric input
* Checks the required date format
* Checks category characters
* Uses a lookahead or back-reference
* Matches activity records against a user-entered pattern

6. Keyboard Navigation Map

* Access the skip-to-content link.
* Navigate through the main navigation links.
* Access dashboard information.
* Move through activity form fields.
* Submit or reset the form.
* Navigate search and sorting controls.
* Access edit and delete actions.
* Navigate settings and import/export controls.
* All interactive elements should have visible focus indicators.

7. Accessibility Notes

Campus Life Planner follows accessibility-focused design practices to make the application usable by students with different needs and abilities.

* Uses semantic elements such as header, nav, main, section, and footer.
* Associates form labels with their corresponding input fields.
* Supports keyboard navigation throughout the interface.
* Includes a skip-to-content link.
* Avoids interactions that require a mouse exclusively.

8. Forms and Feedback

* Displays clear validation and error messages.
* Associates validation messages with the relevant fields.
* Provides accessible feedback when activities are added, edited, or deleted.
* Uses appropriate ARIA live regions for dynamic status updates.

9. Visual Accessibility

* Uses readable text and consistent spacing.
* Maintains sufficient color contrast.
* Avoids relying on color alone to communicate important information.
* Supports mobile, tablet, and desktop screen sizes.( Mobile: approximately 360px, Tablet: approximately 768px, Desktop: approximately 1024px and above.)

10. Testing Instructions

The Campus Life Planner testing checklist contains 79 checks, covering application functionality, validation, accessibility, responsiveness, data persistence, and user experience.

* Open the application in a browser.
* Open tests.html to access the project's test page, where implemented.
* Run the available automated tests and review their results.
* Perform manual checks for features that require user interaction.
* Verify the application at mobile, tablet, and desktop screen sizes.
* Check the browser console for JavaScript errors.
* Confirm that all core features work after refreshing the page.


11. Technologies Used

* HTML5 — Semantic page structure.
* CSS — Styling and responsive layouts.
* JavaScript— Application logic and DOM manipulation.
* Regular Expressions — Input validation and search.
* LocalStorage — Browser-based data persistence.
* JSON — Data import and export.
* Git and GitHub — Version control and repository hosting.
* GitHub Pages — Application deployment.

12. Submission links:

Live Application:
https://sagelessly.github.io/campus-life-planner/


Demo Video:
https://www.youtube.com/watch?v=L0iz5yXVZ8I





