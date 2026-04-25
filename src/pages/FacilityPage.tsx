import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Nav } from "@/components/Nav";
import { FacilityDetail } from "@/components/FacilityDetail";
import { getFacility } from "@/data/facilities";

const FacilityPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const facility = id ? getFacility(id) : undefined;

  if (!facility) {
    return (
      <div className="min-h-screen bg-background">
        <Nav variant="app" />
        <main className="pt-24 px-6 text-center">
          <p className="text-sm text-muted-foreground">Facility not found.</p>
          <Link to="/search" className="mt-4 inline-block text-xs text-primary hover:opacity-80">
            ← Back to search
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      <Nav variant="app" />
      <main className="pt-16 pb-12 px-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 mb-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="bg-panel border border-border-subtle rounded-xl overflow-hidden">
            <FacilityDetail facility={facility} standalone />
          </div>
        </div>
      </main>
    </div>
  );
};

export default FacilityPage;
