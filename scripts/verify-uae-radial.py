"""Alternate radial-coordinate quadrature; does not execute/import JS or PAL."""
import json, math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
def integrate(f,a,b,tolerance=1e-11):
    if a == b:return 0
    def step(a,b,fa,fm,fb,old,tol,depth):
        m=(a+b)/2; l=(a+m)/2; r=(m+b)/2; fl,fr=f(l),f(r)
        left=(m-a)*(fa+4*fl+fm)/6; right=(b-m)*(fm+4*fr+fb)/6
        diff=left+right-old
        if abs(diff)<15*tol:return left+right+diff/15
        if depth==0:raise AssertionError('Radial quadrature did not converge')
        return step(a,m,fa,fl,fm,left,tol/2,depth-1)+step(m,b,fm,fr,fb,right,tol/2,depth-1)
    m=(a+b)/2;fa,fm,fb=f(a),f(m),f(b)
    return step(a,b,fa,fm,fb,(b-a)*(fa+4*fm+fb)/6,tolerance,30)

def radial(p):
    earth=6378120.;h0=p['elevationMeters'];temperature=283.15;lapse=.0065
    gravity=9.784*(1-.0026*math.cos(math.radians(2*p['latitude']))-.00000028*h0)
    C=gravity*28.9644/8314.32;power=C/lapse-1
    coefficient=(287.6155+1.62887/.55**2+.01360/.55**4)*273.15e-6/1013.25
    excess0=coefficient*1010/temperature;t11=temperature-lapse*(11000-h0)
    excess11=excess0*(t11/temperature)**power
    def state(h):
        if h<=11000:
            t=temperature-lapse*(h-h0); e=excess0*(t/temperature)**power
            return e,-e*power*lapse/t
        e=excess11*math.exp(-C*(h-11000)/t11)
        return e,-e*C/t11
    def q(h):return (1+state(h)[0])*(earth+h)
    altitude=math.radians(p['observedAltitudeDegrees']);b=q(h0)*math.cos(altitude)
    base=h0
    if altitude<0:
        low,high=-10000,h0
        for _ in range(80):
            m=(low+high)/2
            if q(m)<b:low=m
            else:high=m
        base=(low+high)/2
    nbase=1+state(base)[0];rbase=earth+base
    # For the turn the invariant is q(base); for an outgoing ray retain the
    # exact finite zenith gap. Stable differences avoid subtracting Earth radii.
    gap=0 if altitude<=0 else q(base)*2*math.sin(altitude/2)**2
    if altitude<0:b=q(base)
    ebase,dnbase=state(base)
    def f(u,upper=False):
        dh=u*u;h=base+dh
        e,dn=state(max(11000+1e-8,h) if upper else min(11000,h))
        if h<=11000 and base<=11000:
            tb=temperature-lapse*(base-h0)
            ndiff=ebase*math.expm1(power*math.log1p(-lapse*dh/tb))
        else:ndiff=e-ebase
        difference=gap+nbase*dh+(rbase+dh)*ndiff
        if u==0:
            if gap>0:return 0
            return -dnbase/nbase*math.sqrt(2*b/(nbase+rbase*dnbase))
        return -dn/(1+e)*b*2*u/math.sqrt(difference*(2*b+difference))
    u11=math.sqrt(11000-base);utop=math.sqrt(80000-base);uobs=math.sqrt(h0-base)
    main=integrate(lambda u:f(u),uobs,u11)+integrate(lambda u:f(u,True),u11,utop)
    if altitude<0:main+=2*integrate(lambda u:f(u),0,uobs)
    ntop=1+state(80000)[0];ztop=math.asin(b/q(80000))
    main+=math.asin(ntop*math.sin(ztop))-ztop
    return math.degrees(main)

fixtures=json.loads((ROOT.parent/'tests/uae-radial-fixtures.json').read_text())['cases']
maximum=max(abs(radial(row['input'])-row['refractionDegrees'])*3600 for row in fixtures)
assert maximum<.00001,maximum
print(f'Checked {len(fixtures)} own radial fixtures; maximum difference {maximum:.12g} arcseconds')
