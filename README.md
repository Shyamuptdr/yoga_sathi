# Yoga Sathi - Real-time Yoga Posture Analysis

Yoga Sathi is a web-based platform that uses your webcam and computer vision to provide real-time feedback on your yoga posture, helping you practice safely and effectively.



## Tech Stack

-   **Backend**: Django, Python 3.9+
-   **Database**: SQLite (default)
-   **Frontend**: HTML, CSS, Bootstrap
-   **Computer Vision**: JavaScript, MediaPipe Pose

## Features

-   **Live Webcam Feed**: See yourself and the pose skeleton in real-time.
-   **Real-time Posture Analysis**: The application calculates key body angles (knees, spine) to assess alignment.
-   **Instant Feedback**: Receive simple, actionable advice like "Straighten your knees" or "Good Alignment!".
-   **Session Tracking**: Start, stop, and track the duration and quality of your yoga session.
-   **Posture Quality Score**: Get a percentage score based on how many frames you held the correct posture.
-   **Save Your Progress**: Save session statistics (duration, quality) to the backend to track your improvement.
-   **Admin Dashboard**: View all saved sessions through the Django admin panel.

## How to Run

Follow these instructions to get the project running on your local machine.

### 1. Prerequisites

-   Python 3.9 or newer
-   `pip` (Python package installer)

### 2. Installation & Setup

1.  **Clone the repository or download the project files.**

2.  **Navigate to the project directory:**
    ```bash
    cd yogasathi_project
    ```

3.  **Install the required Python packages:**
    *(Note: Using a virtual environment is highly recommended for any Python project, but has been omitted as per the prompt instructions.)*
    ```bash
    pip install -r requirements.txt
    ```

4.  **Apply the database migrations:**
    This command sets up the SQLite database schema based on the models defined in the code.
    ```bash
    python manage.py migrate
    ```

5.  **Create a superuser (for admin access):**
    This allows you to log into the Django admin panel. Follow the prompts to create a username and password.
    ```bash
    python manage.py createsuperuser
    ```

### 3. Running the Server

-   **Start the Django development server:**
    ```bash
    python manage.py runserver
    ```

-   Open your web browser and go to: **`http://127.0.0.1:8000/`**

-   You will be prompted to allow camera access. Please allow it for the application to work.

### 4. Using the Admin Panel

-   While the server is running, navigate to: **`http://127.0.0.1:8000/admin/`**
-   Log in with the superuser credentials you created.
-   Here you can view all the yoga sessions that have been saved by users.