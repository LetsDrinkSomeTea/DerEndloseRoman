import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import StoryView from "@/pages/StoryView";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/stories/:id" component={StoryView} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Router />
      <Toaster />
    </div>
  );
}

export default App;
