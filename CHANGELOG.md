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

    End-to-End Test Instability : Some Maestro end-to-end tests are currently failing or unstable due to UI timing issues and reliance on coordinate-based interactions. Certain flows do not consistently reflect the real application state, causing assertions to fail even when the feature works correctly manually. This indicates a need for more stable selectors (e.g., testIDs) and improved synchronization in the test flows.

📦 Documentation

    Updated.