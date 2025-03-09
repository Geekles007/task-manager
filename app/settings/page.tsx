'use client';

import SettingsLayout from '../components/SettingsLayout';
import FormField from '../components/FormField';
import Button from '../components/Button';

export default function SettingsPage() {
  return (
    <SettingsLayout activeSection="general">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-6">General Settings</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Profile</h2>
          
          <form>
            <FormField
              label="Name"
              htmlFor="name"
              description="Your full name as it will appear across the app."
            >
              <input
                id="name"
                type="text"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue="John Doe"
              />
            </FormField>
            
            <FormField
              label="Email"
              htmlFor="email"
              description="Your email address for notifications and login."
            >
              <input
                id="email"
                type="email"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue="john.doe@example.com"
              />
            </FormField>
            
            <FormField
              label="Username"
              htmlFor="username"
              description="Your unique username for mentions and sharing."
            >
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-700 text-gray-400 text-sm">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-r-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  defaultValue="johndoe"
                />
              </div>
            </FormField>
            
            <FormField
              label="Profile Picture"
              htmlFor="avatar"
              description="Upload a profile picture to personalize your account."
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-xl">
                  JD
                </div>
                <Button variant="secondary" size="sm">
                  Upload
                </Button>
                <Button variant="outline" size="sm">
                  Remove
                </Button>
              </div>
            </FormField>
            
            <div className="mt-8 flex justify-end">
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Preferences</h2>
          
          <form>
            <FormField
              label="Time Zone"
              htmlFor="timezone"
              description="Your local time zone for accurate date and time display."
            >
              <select
                id="timezone"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue="America/New_York"
              >
                <option value="America/New_York">Eastern Time (US & Canada)</option>
                <option value="America/Chicago">Central Time (US & Canada)</option>
                <option value="America/Denver">Mountain Time (US & Canada)</option>
                <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </FormField>
            
            <FormField
              label="Language"
              htmlFor="language"
              description="Your preferred language for the user interface."
            >
              <select
                id="language"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                defaultValue="en"
              >
                <option value="en">English</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="es">Spanish</option>
                <option value="ja">Japanese</option>
              </select>
            </FormField>
            
            <div className="mt-8 flex justify-end">
              <Button type="submit">
                Save Preferences
              </Button>
            </div>
          </form>
        </div>
      </div>
    </SettingsLayout>
  );
} 