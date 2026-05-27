**Changelog - MyImpact**
[v1.0.0] - Sprint 0 (Structural Foundation)

🚀Authentication Setup (Added): We implemented a basic authentication screen, allowing users to sign in and access the application. This served as the initial foundation of the app before adding core features and database integration.

[v2.0.0] - Sprint 1 (2026-04-20)
🚀 New Features (Added)

    Report Recycling Bin Issues:Users can now report problems with recycling bins (full, damaged,...), helping authorities improve recycling conditions.

    Station Ratings & Reviews:Added the ability to rate and leave short reviews on recycling stations, giving other users insight into their current condition.

    User Registration (Email & Password):New users can create an account quickly using email and password, enabling immediate access to the app.

    Recycling History (My Impact Log):Users can view a chronological log of their recycling activities, including past entries and environmental contributions.

    Recycling Validation with Photo Upload:Users can log recycled materials (plastic, paper, glass) by attaching a photo, allowing the app to validate entries and award points.
    
    Add New Recycling Locations:Users can add new recycling bin locations to the map, improving accessibility for the community.

    Nearby Recycling Bins with Status:Users can view a map with the nearest recycling bins and check whether they are full or available, helping them avoid unnecessary trips.

🛠️ Technical Improvements (Changed)
    
    Database Integration: The database was implemented and integrated into the application, enabling persistent data storage and supporting dynamic, real-time data instead of static content.

🐛 Known Issues / Bugs (Fixed/Known Issues)

    Camera Permission Handling Crash: When the “Take Photo” button is pressed with camera permissions disabled, the app crashes or redirects to the home screen instead of showing a warning message. This is caused by missing proper permission checks and error handling in the camera flow.

📦 Documentation

    Updated.

[v3.0.0] - Sprint 2 (2026-05-11)
🚀 New Features (Added)

    Profile Editing:Users can now edit their profile information, including personal details, allowing them to customize and keep their account up to date.

    Weekly Friends Leaderboard:Added a weekly leaderboard where users can compare recycling points with friends, encouraging motivation and friendly competition.

    User Profile & Recycling Activity:Users can access a dedicated profile screen to view personal information and track their recycling activity within the app.

    Recycling Objectives & Goals:Users can create personalized recycling objectives to stay motivated and monitor their environmental progress over time.

    MyImpact Wrapped / Recycling Summary:Added a recycling activity summary feature that highlights users’ eco-friendly habits and achievements, making it easy to review and share progress with friends.

    Password Recovery:Users can now recover their password securely in case they forget their account credentials, ensuring continuous access to the app.

    Personalized Home Screen: Introduced a redesigned home screen that greets users and displays:monthly recycling impact, favourite ecopoints,and a highlighted monthly goal allowing quick access to personal sustainability insights and recycling locations.

🛠️ Technical Improvements (Changed)

    Recycling Log Improvement: Previously, the Recycling Log used static data. Now, it is fully connected to the database and displays real user recycling history in real time, making the feature more accurate and reliable.

🐛 Known Issues / Bugs (Fixed/Known Issues)

    Profile Statistics Not Updating in Real Time :Profile statistics were not updating in real time after a new recycling entry, showing outdated values until an app restart. This reduced user trust as changes were not immediately reflected. The issue was fixed by adding a reactive state listener to ensure the UI updates automatically whenever new data is saved.

    End-to-End Test Instability : Some Maestro end-to-end tests are currently failing or unstable due to UI timing issues and reliance on coordinate-based interactions. Certain flows do not consistently reflect the real application state, causing assertions to fail even when the feature works correctly manually. This indicates a need for more stable selectors (e.g., testIDs) and improved synchronization in the test flows.

📦 Documentation

    Updated.


[v4.0.0] - Sprint 3 (2026-05-28)
🚀 New Features (Added)
    Recycling Challenges from Brands/Companies: Users can now participate in recycling challenges sponsored by brands and companies, adding a gamified and community-driven dimension to their eco-friendly habits and increasing engagement with the platform.

    Add an Ecopoint Using Current Location: Users can now contribute to the app's map by submitting a new ecopoint directly from their current location, allowing the community to grow and maintain an up-to-date network of recycling points.

    Search Other Users to Form Friendships: A user search feature has been implemented, enabling users to find and connect with others on the platform, fostering a social recycling community and enabling friendly competition.
    
    Send an Invite via Link to New Users: Users can now generate and share an invite link, making it easy to bring friends and family into the app and grow the platform's user base organically.
    
    View the Maintenance History of an Eco-Bin: Users can access a dedicated screen showing the maintenance history of any eco-bin, increasing transparency and trust in the recycling infrastructure available near them.

🛠️ Technical Improvements (Changed)

    Dark Mode Theme Overhaul: All UI components and input fields have been updated to use theme-aware colour tokens that respond dynamically to the system's light/dark mode setting, replacing previously hard-coded colour values and ensuring full visual consistency across both themes.

🐛 Known Issues / Bugs (Fixed/Known Issues)

    App Sharing Link Not Functioning Correctly: The invite link feature was generating or resolving links incorrectly, preventing recipients from being properly redirected to the app. The deep link configuration was reviewed and corrected, ensuring links now encode the necessary parameters and redirect users to the appropriate onboarding screen.

    Wrapped Feature Requiring Location Unnecessarily: The MyImpact Wrapped feature was triggering a location permission request despite not requiring location data. The dependency was identified and removed, and the component was refactored to operate solely on stored recycling data.

    Recycling History Not Displaying: The recycling history screen was showing an empty state even when the user had previously logged activity. The data fetching logic was debugged and corrected — the screen now loads and displays all past recycling records as expected.

    Map Always Centering on Rotunda da Boavista: Every time a bin was selected on the map, the camera was resetting to the Rotunda da Boavista instead of focusing on the selected bin. The default centre coordinate was removed from the bin selection handler, resolving the behaviour.

    Selected Bin Icon Getting Disrupted on Map: Selecting a bin on the map was causing its icon to become distorted or visually broken. Icon size, anchor points, and z-index properties were adjusted to ensure a clean and consistent selected state.

    Only Shared Objectives Appearing — Personal Ones Missing: The objectives screen was only displaying shared objectives due to a conflict in the filtering logic. The queries were separated and correctly scoped so that both personal and shared objectives now appear independently without overlap or omission.

📦 Documentation
    Updated.    