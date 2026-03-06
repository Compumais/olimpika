/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import ActiveWorkout from './pages/ActiveWorkout';
import ExerciseLibrary from './pages/ExerciseLibrary';
import History from './pages/History';
import Home from './pages/Home';
import ManageExercises from './pages/ManageExercises';
import ManageWorkouts from './pages/ManageWorkouts';
import Profile from './pages/Profile';
import SelectWorkout from './pages/SelectWorkout';
import SetupProfile from './pages/SetupProfile';
import PersonalHome from './pages/PersonalHome';
import ManageStudents from './pages/ManageStudents';
import StudentWorkouts from './pages/StudentWorkouts';
import ListUsers from './pages/ListUsers';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ActiveWorkout": ActiveWorkout,
    "ExerciseLibrary": ExerciseLibrary,
    "History": History,
    "Home": Home,
    "ManageExercises": ManageExercises,
    "ManageWorkouts": ManageWorkouts,
    "Profile": Profile,
    "SelectWorkout": SelectWorkout,
    "SetupProfile": SetupProfile,
    "PersonalHome": PersonalHome,
    "ManageStudents": ManageStudents,
    "StudentWorkouts": StudentWorkouts,
    "ListUsers": ListUsers,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};