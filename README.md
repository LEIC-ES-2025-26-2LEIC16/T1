<!-- Template file for README.md for LEIC-ES-2025-26 -->

> [!NOTE] In this file, you will find the structure you should follow to document your mobile app in the README.md file for LEIC-ES-2025-26. It is a single file with guidelines, as comments, only seen in Edit mode, not in Preview mode. You can add more sections, but for assessment reasons and automation, please make sure to include all sections of this template. Your professors will clarify about specificities of your app.

# MyImpact Development Report

Welcome to the documentation of MyImpact!

This Software Development Report, tailored for LEIC-ES-2025-26, provides comprehensive details about MyImpact, starting from an high-level vision and going into low-level implementation decisions. 

It is organised by the following activities: 

* [Business modeling](#Business-Modelling) 
  * [Product Vision](#Product-Vision)
  * [Features and Assumptions](#Features-and-Assumptions)
* [Requirements](#Requirements)
  * [User stories](#User-stories)
  * [Domain model](#Domain-model)
  * [User interfaces](#User-interfaces)
* [Architecture and Design](#Architecture-And-Design)
  * [Logical architecture](#Logical-Architecture)
  * [Physical architecture](#Physical-Architecture)
  * [Functional prototype](#Functional-Prototype)
* [Project management](#Project-Management)
  * [Sprint 0](#Sprint-0)
  * [Sprint 1](#Sprint-1)
  * [Sprint 2](#Sprint-2)
  * [Sprint 3](#Sprint-3)
  * [Final Release](#Final-Release)

Contributions are expected to be made exclusively by the initial team, but we may open them to the community, after the course, in all areas and topics: requirements, technologies, development, experimentation, testing, etc.

Please contact us!

Thank you!

* Ariana Lopes da Costa up202404631@edu.fe.up.pt
* Madalena Cordeiro Rodrigues up202404211@edu.fe.up.pt
* Miguel Ângelo Quintais Frias up202406974@edu.fe.up.pt
* Ricardo Manuel da Cunha Estevéns up202405321@edu.fe.up.pt
* Tiago Rafael Usandivares Meireles up202403644@edu.fe.up.pt

---
## Business Modelling

MyImpact will be an app where the users will be able to track their recycling and the same time  

### Product Vision

For eco-conscious citizens and communities
Who need an incentive to maintain daily recycling habits,
MyImpact is a gamified mobile application
That transforms everyday waste separation into a rewarding, social, and competitive experience.
Unlike traditional recycling systems that rely solely on civic goodwill,
Our product actively motivates users through a point-based reward system, weekly leaderboards, and real-world benefits, driving a measurable and lasting positive impact on the environment.

### Features and Assumptions
### Features

- Account Management & Customization - Users can register (via email or Google), manage their profiles, and spend earned coins on cosmetic upgrades like profile borders.
- Photo-Verified Recycling - A core system where users log their recycling by snapping a photo of the items at the bin to earn reward points.
- Interactive Eco-Bin Map - A community-driven map to locate nearby recycling bins, check their current capacity, report issues, and add unlisted bins.
- Social Leaderboards - A competitive space where users can invite friends via a link and compare their recycling progress in weekly or monthly rankings.
- Personal & Corporate Goals - Users can set their own recycling milestones or participate in sponsored challenges created by partner companies to earn bonus rewards.
- Yearly Recycling Insights - A personal analytics dashboard tracking monthly habits, culminating in a highly shareable, "Wrapped"-style annual summary.
- Government Initiatives Hub - An informational feed keeping users updated on local government recycling payback programs and future partnerships.

### Assumptions and Dependencies

**Assumptions:**
- Users own smartphones with a functional camera and active GPS/location services.
- Users are willing to interact with the app at the exact moment of disposal to ensure the accuracy of the location and the photo.
- The community will be motivated enough by the gamification elements to actively report bin issues and keep the map accurate.
- Local businesses and governments will be open to partnering with the platform to sponsor goals or provide tangible rewards.

**Dependencies:**
- **Mapping Systems:** The interactive map feature depends on a third-party mapping API (such as Google Maps or Mapbox) to display locations and handle user navigation.
- **Image Verification:** Validating the submitted recycling photos to prevent cheating will likely depend on an external AI image recognition API or a cloud processing service.
- **External Authentication:** The quick registration process depends on third-party authentication providers (e.g., Google Sign-In API).
## Requirements

### User Stories

To address our product vision, the requirements for MyImpact were structured into user stories following the INVEST guidelines. Rather than listing every individual story here, they are grouped into four main core epics (fully detailed with Gherkin acceptance tests in our GitHub Project Board):

* **User Management & Customization:** Authentication, profile management, password recovery, and cosmetic progression.
* **Tracking & Gamification:** The core loop of logging recycling via photo verification, viewing history, leaderboards, and setting goals.
* **Interactive Mapping & Community:** Locating nearby Eco-bins, checking capacity, adding bins, leaving reviews, and reporting maintenance issues.
* **Social & Corporate Integration:** Inviting friends and participating in B2B corporate-sponsored recycling challenges.

### Domain model

<!-- 
To better understand the context of the software system, it is useful to have a simple UML class diagram with all and only the key concepts (names, attributes) and relationships involved of the problem domain addressed by your app. 
Also provide a short textual description of each concept (domain class). 

Example:
 <p align="center" justify="center">
  <img src="https://github.com/FEUP-LEIC-ES-2022-23/templates/blob/main/images/DomainModel.png"/>
</p>
-->


## Architecture and Design
<!--
The architecture of a software system encompasses the set of key decisions about its organization. 

A well written architecture document is brief and reduces the amount of time it takes new programmers to a project to understand the code to feel able to make modifications and enhancements.

To document the architecture requires describing the decomposition of the system in their parts (high-level components) and the key behaviors and collaborations between them. 

In this section you should start by briefly describing the components of the project and their interrelations. You should describe how you solved typical problems you may have encountered, pointing to well-known architectural and design patterns, if applicable.
-->


### Logical architecture
<!--
The purpose of this subsection is to document the high-level logical structure of the code (Logical View), using a UML diagram with logical packages, without the worry of allocating to components, processes or machines.

It can be beneficial to present the system in a horizontal decomposition, defining layers and implementation concepts, such as the user interface, business logic and concepts.

Example of _UML package diagram_ showing a _logical view_ of the Eletronic Ticketing System (to be accompanied by a short description of each package):

![LogicalView](https://user-images.githubusercontent.com/9655877/160585416-b1278ad7-18d7-463c-b8c6-afa4f7ac7639.png)
-->


### Physical architecture
<!--
The goal of this subsection is to document the high-level physical structure of the software system (machines, connections, software components installed, and their dependencies) using UML deployment diagrams (Deployment View) or component diagrams (Implementation View), separate or integrated, showing the physical structure of the system.

It should describe also the technologies considered and justify the selections made. Examples of technologies relevant for ESOF are, for example, frameworks for mobile applications (such as Flutter).

Example of _UML deployment diagram_ showing a _deployment view_ of the Eletronic Ticketing System (please notice that, instead of software components, one should represent their physical/executable manifestations for deployment, called artifacts in UML; the diagram should be accompanied by a short description of each node and artifact):

![DeploymentView](https://user-images.githubusercontent.com/9655877/160592491-20e85af9-0758-4e1e-a704-0db1be3ee65d.png)
-->


### Functional prototype
<!--
To help on validating all the architectural, design and technological decisions made, we usually implement a functional prototype, a thin vertical slice of the system integrating as much technologies as we can.

In this subsection please describe which feature, or part of it, you have implemented, and how, together with a snapshot of the user interface, if applicable.

At this phase, instead of a complete user story, you can simply implement a small part of a feature that demonstrates thay you can use the technology, for example, show a screen with the app credits (name and authors).
-->

## Project management
<!--
Software project management is the art and science of planning and leading software projects, in which they are planned, implemented, monitored and controlled.

In the context of ESOF, we recommend each team to adopt a set of project management practices and tools capable of registering tasks, assigning tasks to team members, adding estimations to tasks, monitor tasks progress, and therefore being able to track their projects.

Common practices of managing agile software development with Scrum are: backlog management, release management, estimation, Sprint planning, Sprint development, acceptance tests, and Sprint retrospectives.

You can find below information and references related with the project management: 

* Backlog management: Product backlog and Sprint backlog in a [Github Projects board](https://github.com/orgs/FEUP-LEIC-ES-2023-24/projects/64);
* Release management: [v0](#), v1, v2, v3, ...;
* Sprint planning and retrospectives: 
  * plans: screenshots of Github Projects board at begin and end of each Sprint;
  * retrospectives: meeting notes in a document in the repository, addressing the following questions:
    * Did well: things we did well and should continue;
    * Do differently: things we should do differently and how;
    * Puzzles: things we don’t know yet if they are right or wrong;
    * list of a few improvements to implement next Sprint;

-->

### Sprint 0

### Sprint 1

### Sprint 2

### Sprint 3

### Sprint 4

### Final Release
