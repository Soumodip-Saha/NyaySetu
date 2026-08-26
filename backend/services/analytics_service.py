from typing import Dict, Any, List
from backend.models.schemas import GovtDashboardMetrics

class AnalyticsService:
    def get_dashboard_metrics(self) -> GovtDashboardMetrics:
        """
        Aggregates metrics for the National Access to Justice Intelligence Hub (DISHA 2.0 alignment).
        """
        category_distribution = {
            "Property & Land Disputes": 340,
            "Family & Matrimonial": 210,
            "Consumer Protection & Fraud": 175,
            "Labor & Employment": 155,
            "Cybercrime & Digital Fraud": 140,
            "Tenancy & Real Estate Rent": 98,
            "Criminal & Bail Matters": 92,
            "Civil Contracts & Commercial": 80,
            "Motor Accident Claims (MACT)": 60
        }

        # Heatmap of demand vs supply across major states/districts
        state_demand_supply_heatmap = [
            {
                "state": "West Bengal",
                "district": "Kolkata & 24 Parganas",
                "demand_cases": 412,
                "active_providers": 84,
                "supply_gap_index": "Low Gap (Well Served)",
                "common_dispute": "Land Partition & Tenancy",
                "tele_law_utilization": "91%"
            },
            {
                "state": "Maharashtra",
                "district": "Mumbai & Pune Metro",
                "demand_cases": 380,
                "active_providers": 76,
                "supply_gap_index": "Low Gap",
                "common_dispute": "Cybercrime & Commercial",
                "tele_law_utilization": "88%"
            },
            {
                "state": "Uttar Pradesh",
                "district": "Lucknow, Varanasi & Gorakhpur",
                "demand_cases": 590,
                "active_providers": 52,
                "supply_gap_index": "High Supply Deficit (Target Zone)",
                "common_dispute": "Revenue & Revenue Encroachment",
                "tele_law_utilization": "74%"
            },
            {
                "state": "Delhi NCR",
                "district": "Central, South & Dwarka",
                "demand_cases": 310,
                "active_providers": 92,
                "supply_gap_index": "Optimal Supply",
                "common_dispute": "Labor Termination & Matrimonial",
                "tele_law_utilization": "95%"
            },
            {
                "state": "Tamil Nadu",
                "district": "Chennai & Coimbatore",
                "demand_cases": 265,
                "active_providers": 60,
                "supply_gap_index": "Low Gap",
                "common_dispute": "Mediation & Consumer Claims",
                "tele_law_utilization": "89%"
            },
            {
                "state": "Bihar",
                "district": "Patna & Muzaffarpur",
                "demand_cases": 480,
                "active_providers": 38,
                "supply_gap_index": "Critical Legal Aid Gap",
                "common_dispute": "Ancestral Land & Bail",
                "tele_law_utilization": "68%"
            }
        ]

        disha_alignment = {
            "tele_law_cases_assisted": 12840,
            "nyaya_bandhu_pro_bono_hours": 4650,
            "gram_nyayalaya_referrals": 820,
            "average_first_consultation_time": "1.8 Days (down from 45 days)",
            "misrouted_case_savings_crores_inr": "₹14.2 Cr",
            "citizen_satisfaction_rate": "96.4%"
        }

        return GovtDashboardMetrics(
            total_cases_routed=1350,
            average_routing_time_seconds=1.4,
            misrouted_cases_decrease_percent=75.0,
            avg_first_consultation_delay_days=1.8,
            total_pro_bono_hours_logged=4650,
            total_nyay_credits_distributed=28450,
            cost_saved_for_citizens_inr=14200000.0,
            district_coverage_count=512,
            category_distribution=category_distribution,
            state_demand_supply_heatmap=state_demand_supply_heatmap,
            disha_alignment_status=disha_alignment
        )

analytics_service = AnalyticsService()
