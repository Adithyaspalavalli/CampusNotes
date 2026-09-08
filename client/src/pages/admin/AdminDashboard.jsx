import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";

function AdminDashboard() {
  return (
    <>
      <Navbar />

      <PageContainer>
        <h1>Admin Dashboard</h1>

        <p>
          Welcome Admin.
        </p>
      </PageContainer>
    </>
  );
}

export default AdminDashboard;