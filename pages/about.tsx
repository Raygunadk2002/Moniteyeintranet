import { Card } from "../components/ui/card";
import Layout from "../components/Layout";

export default function About() {
  return (
    <Layout>
      <div className="flex-1 bg-gray-50 p-6">
        <div className="bg-white border-b border-gray-200 px-6 py-4 -mx-6 -mt-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">About Moniteye Intranet</h1>
          <p className="text-gray-600 mt-1">Learn more about our company and platform</p>
        </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">🏢 Company Overview</h3>
              <p className="text-gray-600 mb-4">
                Moniteye is a cutting-edge monitoring and analytics platform designed to help 
                businesses track, analyze, and optimize their operations in real-time.
              </p>
              <ul className="space-y-2 text-gray-600">
                <li>• Founded in 2020</li>
                <li>• 50+ employees worldwide</li>
                <li>• Serving 1000+ customers</li>
                <li>• 99.9% uptime SLA</li>
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">🎯 Our Mission</h3>
              <p className="text-gray-600 mb-4">
                To empower organizations with intelligent monitoring solutions that drive 
                data-driven decision making and operational excellence.
              </p>
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-blue-800 text-sm italic">
                  "Making the invisible visible, turning data into insights, 
                  and insights into action."
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">🛠️ Platform Features</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-green-50 p-3 rounded">
                  <div className="font-medium text-green-800">Real-time Monitoring</div>
                  <div className="text-green-600">24/7 system surveillance</div>
                </div>
                <div className="bg-blue-50 p-3 rounded">
                  <div className="font-medium text-blue-800">Advanced Analytics</div>
                  <div className="text-blue-600">AI-powered insights</div>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <div className="font-medium text-purple-800">Custom Dashboards</div>
                  <div className="text-purple-600">Personalized views</div>
                </div>
                <div className="bg-orange-50 p-3 rounded">
                  <div className="font-medium text-orange-800">Alert Management</div>
                  <div className="text-orange-600">Intelligent notifications</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">📞 Contact Information</h3>
              <div className="space-y-3 text-gray-600">
                <div>
                  <strong>Headquarters:</strong><br />
                  123 Innovation Drive<br />
                  Tech City, TC 12345
                </div>
                <div>
                  <strong>Phone:</strong> +1 (555) 123-4567
                </div>
                <div>
                  <strong>Email:</strong> info@moniteye.com
                </div>
                <div>
                  <strong>Support:</strong> support@moniteye.com
                </div>
              </div>
            </Card>
        </div>
      </div>
    </Layout>
  );
} 