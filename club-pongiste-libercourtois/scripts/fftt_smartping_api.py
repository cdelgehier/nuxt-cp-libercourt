# Requirements: pip install requests beautifulsoup4 pydantic
import requests
from bs4 import BeautifulSoup
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
import json
import re


class FFTTLicensee(BaseModel):
    """
    Model for FFTT licensee data from SmartPing API or HTML parsing.
    Based on FFTT official specifications.
    """

    licence: str = Field(..., description="License number from FFTT")
    nom: str = Field(..., description="Last name of the player")
    prenom: str = Field(..., description="First name of the player")
    club: str = Field(..., description="Club number")
    nclub: str = Field(default="", description="Club name")
    points: int = Field(default=0, description="Current points of the player")
    classement: str = Field(default="", description="Current ranking")
    echelon: str = Field(default="", description="Player level")
    place: int = Field(default=0, description="Place in ranking")
    natio: str = Field(default="F", description="Nationality code")
    sexe: str = Field(default="", description="Gender M/F")
    type: str = Field(default="A", description="License type A/J/V")
    certif: str = Field(default="", description="Medical certificate status")
    valide: str = Field(default="", description="License validity")
    echelon_mixte: str = Field(default="", description="Mixed ranking level")


class SmartPingAPI:
    """
    Official FFTT SmartPing API client.
    Handles authentication and data retrieval.
    """

    def __init__(self, api_key: str, base_url: str = "https://www.fftt.com/mobile/pxml/"):
        self.api_key = api_key
        self.base_url = base_url
        self.session = requests.Session()

    def get_club_licensees(self, club_id: str) -> List[FFTTLicensee]:
        """
        Get all licensees for a specific club using SmartPing API.

        Args:
            club_id: The club ID (e.g., "07620112")

        Returns:
            List of licensees from the club
        """
        # SmartPing API endpoint for club licensees
        url = f"{self.base_url}xml_liste_joueur_o.php"

        params = {
            "serie": self.api_key,
            "club": club_id,
            "type": "xml"
        }

        try:
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            # Parse XML response
            licensees = self._parse_xml_licensees(response.content)
            return licensees

        except requests.RequestException as e:
            print(f"Error fetching data from SmartPing API: {e}")
            return []

    def _parse_xml_licensees(self, xml_content: bytes) -> List[FFTTLicensee]:
        """
        Parse XML response from SmartPing API to extract licensee data.

        Args:
            xml_content: Raw XML content from API response

        Returns:
            List of parsed licensees
        """
        licensees = []

        try:
            soup = BeautifulSoup(xml_content, 'xml')

            # Find all licensee entries in XML
            for joueur in soup.find_all('joueur'):
                licensee_data = {
                    'licence': joueur.get('licence', ''),
                    'nom': joueur.get('nom', ''),
                    'prenom': joueur.get('prenom', ''),
                    'club': joueur.get('club', ''),
                    'nclub': joueur.get('nclub', ''),
                    'points': int(joueur.get('points', 0)),
                    'classement': joueur.get('classement', ''),
                    'echelon': joueur.get('echelon', ''),
                    'place': int(joueur.get('place', 0)),
                    'natio': joueur.get('natio', 'F'),
                    'sexe': joueur.get('sexe', ''),
                    'type': joueur.get('type', 'A'),
                    'certif': joueur.get('certif', ''),
                    'valide': joueur.get('valide', ''),
                    'echelon_mixte': joueur.get('echelon_mixte', '')
                }

                licensee = FFTTLicensee(**licensee_data)
                licensees.append(licensee)

        except Exception as e:
            print(f"Error parsing XML licensees: {e}")

        return licensees


class PingPocketHTMLParser:
    """
    HTML parser for PingPocket website as fallback.
    Extracts licensee data from HTML elements.
    """

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Club-Pongiste-Libercourtois/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        })

    def get_club_licensees_html(self, club_id: str) -> List[Dict[str, Any]]:
        """
        Parse licensees from PingPocket HTML page.

        Args:
            club_id: The club ID (e.g., "07620112")

        Returns:
            List of licensee data dictionaries
        """
        url = f"https://www.pingpocket.fr/app/fftt/clubs/{club_id}/licencies?SORT=ALPHABETIC"

        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()

            licensees = self._parse_html_licensees(response.text, club_id)
            return licensees

        except requests.RequestException as e:
            print(f"Error fetching HTML from PingPocket: {e}")
            return []

    def _parse_html_licensees(self, html_content: str, club_id: str = "") -> List[Dict[str, Any]]:
        """
        Parse HTML content to extract licensee information.

        Args:
            html_content: Raw HTML from PingPocket
            club_id: Club ID for reference

        Returns:
            List of licensee data dictionaries
        """
        licensees = []

        try:
            soup = BeautifulSoup(html_content, 'html.parser')

            # Look for elements with labels class containing name + firstname
            labels = soup.find_all('div', class_='labels')

            for label in labels:
                # Extract name and firstname from labels div
                name_text = label.get_text(strip=True)

                # Look for associated counter with points
                counter = label.find_next('small', class_='counter pos')
                points = 0
                if counter:
                    points_text = counter.get_text(strip=True)
                    # Extract numeric points from text
                    points_match = re.search(r'\d+', points_text)
                    if points_match:
                        points = int(points_match.group())

                # Parse name (assuming format "LASTNAME Firstname")
                name_parts = name_text.split()
                if len(name_parts) >= 2:
                    lastname = name_parts[0]
                    firstname = ' '.join(name_parts[1:])

                    licensee_data = {
                        'nom': lastname,
                        'prenom': firstname,
                        'points': points,
                        'club': club_id,
                        'source': 'pingpocket_html'
                    }

                    licensees.append(licensee_data)

        except Exception as e:
            print(f"Error parsing HTML licensees: {e}")

        return licensees


def convert_fftt_to_nuxt_format(fftt_licensee: FFTTLicensee) -> Dict[str, Any]:
    """
    Convert FFTT licensee data to Nuxt application format.

    Args:
        fftt_licensee: FFTT licensee object

    Returns:
        Dictionary in Nuxt application format
    """
    # Calculate age category from points/level
    def get_category_from_echelon(echelon: str, points: int) -> str:
        """Determine age category from player level and points"""
        if 'POU' in echelon.upper():
            return 'poussin'
        elif 'BEN' in echelon.upper():
            return 'benjamin'
        elif 'MIN' in echelon.upper():
            return 'minime'
        elif 'CAD' in echelon.upper():
            return 'cadet'
        elif 'JUN' in echelon.upper():
            return 'junior'
        elif 'SEN' in echelon.upper():
            return 'senior'
        elif 'VET' in echelon.upper():
            return 'veteran'
        else:
            # Default based on points
            if points < 500:
                return 'benjamin'
            elif points < 800:
                return 'minime'
            elif points < 1200:
                return 'senior'
            else:
                return 'veteran'

    # Estimate age from category (rough approximation)
    def estimate_age_from_category(category: str) -> int:
        """Estimate age from category"""
        age_map = {
            'poussin': 8,
            'benjamin': 10,
            'minime': 13,
            'cadet': 16,
            'junior': 17,
            'senior': 25,
            'veteran': 50,
            'surclasse': 65
        }
        return age_map.get(category, 25)

    category = get_category_from_echelon(fftt_licensee.echelon, fftt_licensee.points)
    age = estimate_age_from_category(category)

    return {
        'id': fftt_licensee.licence,
        'firstName': fftt_licensee.prenom,
        'lastName': fftt_licensee.nom,
        'licenseNumber': fftt_licensee.licence,
        'age': age,
        'category': category,
        'email': None,  # Not provided by FFTT API
        'phone': None,  # Not provided by FFTT API
        'active': fftt_licensee.valide.upper() == 'O' if fftt_licensee.valide else True,
        'points': fftt_licensee.points,
        'classement': fftt_licensee.classement,
        'echelon': fftt_licensee.echelon
    }


def main():
    """
    Main function to test the SmartPing API and HTML parser.
    Can be called from command line with club_id and optional api_key.
    """
    import sys

    # Get arguments from command line
    if len(sys.argv) < 2:
        club_id = "07620112"  # Default club ID
    else:
        club_id = sys.argv[1]

    api_key = None
    if len(sys.argv) >= 3:
        api_key = sys.argv[2]
        if api_key == "YOUR_SMARTPING_API_KEY":
            api_key = None

    print("🏓 Testing FFTT SmartPing API and PingPocket HTML Parser")
    print("=" * 60)
    print(f"Club ID: {club_id}")

    result = {
        "success": False,
        "licensees": [],
        "source": "mock",
        "club_id": club_id
    }

    # Test SmartPing API if API key is provided
    if api_key:
        print("🔑 Testing SmartPing API...")
        smart_ping = SmartPingAPI(api_key)
        fftt_licensees = smart_ping.get_club_licensees(club_id)

        if fftt_licensees:
            print(f"✅ Found {len(fftt_licensees)} licensees from SmartPing API")

            # Convert to dictionary format
            licensees_data = []
            for licensee in fftt_licensees:
                licensee_dict = licensee.model_dump()
                licensees_data.append(licensee_dict)

            result = {
                "success": True,
                "licensees": licensees_data,
                "source": "smartping",
                "club_id": club_id,
                "count": len(licensees_data)
            }

            # Output JSON for Node.js consumption
            print(json.dumps(result))
            return
        else:
            print("❌ No licensees found from SmartPing API")
    else:
        print("⚠️  SmartPing API key not provided, skipping API test")

    # Test HTML parser as fallback
    print("\n🌐 Testing PingPocket HTML parser...")
    html_parser = PingPocketHTMLParser()
    html_licensees = html_parser.get_club_licensees_html(club_id)

    if html_licensees:
        print(f"✅ Found {len(html_licensees)} licensees from HTML parsing")

        result = {
            "success": True,
            "licensees": html_licensees,
            "source": "pingpocket_html",
            "club_id": club_id,
            "count": len(html_licensees)
        }

        # Output JSON for Node.js consumption
        print(json.dumps(result))
        return
    else:
        print("❌ No licensees found from HTML parsing")

    # Final fallback - output empty result for mock data handling
    result = {
        "success": False,
        "licensees": [],
        "source": "mock",
        "club_id": club_id,
        "count": 0,
        "message": "No data found from external sources, will use mock data"
    }

    print(json.dumps(result))


if __name__ == "__main__":
    main()
