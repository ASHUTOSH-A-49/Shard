import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Palette, 
  Save,
  Moon,
  Sun,
  Monitor,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useThemeStore } from '@/store/themeStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// 👇 Firebase Imports
import { updateProfile } from 'firebase/auth';
import { auth } from '../services/firebase'; 

export default function Settings() {
  const { theme, setTheme } = useThemeStore();
  const { user } = useAuth();
  
  // Local state
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with current user data
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    } else if (auth.currentUser?.displayName) {
      setDisplayName(auth.currentUser.displayName);
    }
  }, [user]);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    if (!displayName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsSaving(true);

    try {
      // Update Firebase Profile
      await updateProfile(auth.currentUser, {
        displayName: displayName
      });

      toast.success('Profile updated successfully!');
      
      // Optional: You might need to reload the page to see changes in the sidebar/header immediately
      // window.location.reload(); 

    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and application preferences
        </p>
      </motion.div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="w-4 h-4 mr-2" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Name Field (Editable) */}
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your full name" 
                  />
                </div>

                {/* Email Field (Read-Only) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={user?.email || ''} 
                    disabled 
                    className="bg-muted text-muted-foreground opacity-70 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                </div>

                <div className="pt-2">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Choose your preferred color scheme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Sun className="w-6 h-6 mx-auto mb-2 text-warning" />
                    <p className="font-medium text-foreground">Light</p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Moon className="w-6 h-6 mx-auto mb-2 text-info" />
                    <p className="font-medium text-foreground">Dark</p>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="p-4 rounded-xl border-2 border-border opacity-50 cursor-not-allowed"
                  >
                    <Monitor className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium text-foreground">System</p>
                    <p className="text-xs text-muted-foreground">Coming soon</p>
                  </motion.button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}